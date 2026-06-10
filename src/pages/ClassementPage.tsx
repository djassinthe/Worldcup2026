import { useState, useEffect, useMemo, useId } from 'react'
import { X, Users, Target, Calendar, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Player } from '../types'
import {
  type BracketData,
  migrateData,
  getChampion,
  GROUPS,
  GROUP_TEAMS,
  getQuarterWinner,
  getThirdPlace,
  getFinalTeam,
} from '../utils/bracketData'
import { calculateScore, type ScoreBreakdown } from '../utils/scoreUtils'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RankEntry {
  player_id: string
  pseudo: string
  breakdown: ScoreBreakdown
  champion: { name: string; flag: string } | null
  bracketData: BracketData | null
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const PAL = ['#003087','#7c3aed','#16a34a','#d97706','#dc2626','#0891b2','#6b7280','#db2777','#0d9488','#9333ea']
function avColor(p: string) { let h=0; for(let i=0;i<p.length;i++) h=p.charCodeAt(i)+((h<<5)-h); return PAL[Math.abs(h)%PAL.length] }
function initials(p: string) { return p[0]?.toUpperCase() ?? '?' }

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Spark({ pts, color='#003087', w=52, h=20 }: { pts:number[]; color?:string; w?:number; h?:number }) {
  if (pts.length < 2) return null
  const mn=Math.min(...pts), mx=Math.max(...pts), rng=mx-mn||1
  const d=pts.map((v,i)=>{const x=(i/(pts.length-1))*w; const y=h-2-((v-mn)/rng)*(h-4); return `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`}).join(' ')
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function trend(total: number, rank: number) {
  const s=(total*7+rank*11)%89; const slope=rank<=1?3.2:rank<=2?-1.5:rank%2===0?1.2:-0.8
  return [0,1,2,3,4].map(i=>total-14+i*slope+Math.sin(s+i*1.9)*3)
}

// ─── Laurel wreath ────────────────────────────────────────────────────────────

function Laurels({ sz }: { sz: number }) {
  const lc='#c8960c', arm=Math.round(sz*0.52)
  const ls=[{cx:22,cy:9,rx:5.5,ry:9.5,rot:-40},{cx:17,cy:23,rx:5.5,ry:9,rot:-22},{cx:15,cy:37,rx:5,ry:8.5,rot:-6},{cx:17,cy:50,rx:4.5,ry:7.5,rot:9}]
  return (
    <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',width:sz+arm*2,height:sz+10}}>
      <svg style={{position:'absolute',left:0,top:5,width:arm,height:sz}} viewBox="0 0 34 62" fill="none">
        {ls.map((l,i)=><ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill={lc} transform={`rotate(${l.rot} ${l.cx} ${l.cy})`} opacity={0.9-i*0.05}/>)}
      </svg>
      <div style={{position:'relative',zIndex:1,width:sz,height:sz,fontSize:Math.round(sz*0.4),borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(140deg,#fada5e 0%,#f5a623 45%,#c87800 100%)',boxShadow:'0 4px 18px rgba(245,166,35,.55)',fontFamily:'inherit',fontWeight:800,color:'white',lineHeight:1}}>1</div>
      <svg style={{position:'absolute',right:0,top:5,width:arm,height:sz}} viewBox="0 0 34 62" fill="none">
        {ls.map((l,i)=><ellipse key={i} cx={34-l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill={lc} transform={`rotate(${-l.rot} ${34-l.cx} ${l.cy})`} opacity={0.9-i*0.05}/>)}
      </svg>
    </div>
  )
}

// ─── Realistic medal badge (gold / silver / bronze) ─────────────────────────
// Shared between podium cards and leaderboard rows for visual consistency.

const MEDAL: Record<number,{light:string;mid:string;dark:string;rim:string;rimDark:string;num:string;numHi:string}> = {
  1:{light:'#f7e9a8',mid:'#dcc05a',dark:'#a07d21',rim:'#caa42a',rimDark:'#806515',num:'#6f5410',numHi:'#fff6d0'},
  2:{light:'#f3f6fa',mid:'#c4ccd8',dark:'#828b99',rim:'#aab2bf',rimDark:'#6c7480',num:'#565d68',numHi:'#ffffff'},
  3:{light:'#e8c594',mid:'#bd7e3f',dark:'#7c4d22',rim:'#a86a30',rimDark:'#6c4420',num:'#583718',numHi:'#f5dcb6'},
}

function Medal({ rank, size=36 }: { rank:number; size?:number }) {
  const raw=useId()
  const uid=raw.replace(/[^a-zA-Z0-9]/g,'')
  const m=MEDAL[rank]
  if (!m) {
    // Ranks 4+ — simple neutral circular badge
    return (
      <div style={{width:size,height:size,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:Math.round(size*0.4),color:'#9ca3af',background:'#f1f3f5',border:'1px solid #e3e6ea',fontFamily:'inherit',lineHeight:1}}>{rank}</div>
    )
  }
  const fg=`f${uid}`,rg=`r${uid}`,sh=`s${uid}`,ds=`d${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{display:'block',flexShrink:0}}>
      <defs>
        <radialGradient id={fg} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={m.light}/>
          <stop offset="52%" stopColor={m.mid}/>
          <stop offset="100%" stopColor={m.dark}/>
        </radialGradient>
        <linearGradient id={rg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={m.rim}/>
          <stop offset="100%" stopColor={m.rimDark}/>
        </linearGradient>
        <radialGradient id={sh} cx="34%" cy="26%" r="42%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
        <filter id={ds} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.1" stdDeviation="1.1" floodColor="#1a1205" floodOpacity="0.3"/>
        </filter>
      </defs>
      <g filter={`url(#${ds})`}>
        {/* outer rim */}
        <circle cx="20" cy="20" r="18.5" fill={`url(#${rg})`}/>
        {/* metallic face */}
        <circle cx="20" cy="20" r="15.2" fill={`url(#${fg})`}/>
        {/* engraved groove ring */}
        <circle cx="20" cy="20" r="15.2" fill="none" stroke={m.rimDark} strokeOpacity="0.3" strokeWidth="0.6"/>
        <circle cx="20" cy="20" r="13.6" fill="none" stroke={m.light} strokeOpacity="0.45" strokeWidth="0.7"/>
        {/* shine */}
        <ellipse cx="15" cy="13" rx="9" ry="6" fill={`url(#${sh})`}/>
      </g>
      {/* embossed number — light highlight under, dark face over */}
      <text x="20" y="21.1" textAnchor="middle" dominantBaseline="central" fontFamily="inherit" fontWeight="800" fontSize="18" fill={m.numHi} fillOpacity="0.55">{rank}</text>
      <text x="20" y="20.3" textAnchor="middle" dominantBaseline="central" fontFamily="inherit" fontWeight="800" fontSize="18" fill={m.num}>{rank}</text>
    </svg>
  )
}

// ─── Player modal ─────────────────────────────────────────────────────────────

function PlayerModal({ entry, onClose }: { entry: RankEntry; onClose: () => void }) {
  const d=entry.bracketData
  const f0=d?getFinalTeam(d,0):null, f1=d?getFinalTeam(d,1):null
  const s0=d?getQuarterWinner(d,0):null,s1=d?getQuarterWinner(d,1):null,s2=d?getQuarterWinner(d,2):null,s3=d?getQuarterWinner(d,3):null
  const third=d?getThirdPlace(d):null
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}; document.addEventListener('keydown',fn); return()=>document.removeEventListener('keydown',fn)},[onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div role="dialog" aria-modal="true" className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{background:'#003087'}}>
          <div className="flex items-center gap-3">
            <div className="rounded-full flex items-center justify-center font-black text-[14px] uppercase text-white" style={{width:36,height:36,background:avColor(entry.pseudo)}}>{initials(entry.pseudo)}</div>
            <div><p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Pronostic de</p><p className="font-condensed text-[20px] font-700 uppercase text-white leading-tight">{entry.pseudo}</p></div>
          </div>
          <button onClick={onClose} autoFocus aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><X size={16}/></button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {!d?<div className="px-6 py-12 text-center text-[13px] text-gray-400">Aucun bracket soumis.</div>:<>
            <div className="px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Champion</p>
              {entry.champion?<div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"><span className="text-3xl">{entry.champion.flag}</span><span className="font-condensed text-[20px] font-700 uppercase text-amber-800">{entry.champion.name}</span></div>:<p className="text-[13px] text-gray-400">Non sélectionné</p>}
            </div>
            <div className="px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Finale</p>
              <div className="grid grid-cols-2 gap-2">{[f0,f1].map((t,i)=>t?<div key={i} className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${entry.champion?.name===t.name?'bg-[#003087] border-[#003087] text-white':'bg-gray-50 border-gray-200'}`}><span>{t.flag}</span><span className="text-[12px] font-semibold truncate">{t.name}</span></div>:<div key={i} className="px-3 py-2 border border-dashed border-gray-200 rounded-lg text-[12px] text-gray-300">—</div>)}</div>
              {third&&<p className="text-[12px] text-gray-500 mt-2"><span className="font-semibold text-gray-400">3e place :</span> {third.flag} {third.name}</p>}
            </div>
            <div className="px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Demi-finalistes</p>
              <div className="grid grid-cols-2 gap-2">{[s0,s1,s2,s3].map((t,i)=>t?<div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg"><span>{t.flag}</span><span className="text-[12px] font-medium text-[#003087] truncate">{t.name}</span></div>:<div key={i} className="px-3 py-2 border border-dashed border-gray-200 rounded-lg text-[12px] text-gray-300">—</div>)}</div>
            </div>
            <div className="px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Qualifiés par groupe</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                {GROUPS.map(g=>{const q=d.groupQualified[g];const teams=GROUP_TEAMS[g];const t1=teams?.[q?.[0]],t2=q?.[1]!==-1?teams?.[q?.[1]]:null,t3=(q?.[2]!==undefined&&q?.[2]!==-1)?teams?.[q?.[2]]:null
                  return(<div key={g}><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Gr. {g}</p><div className="space-y-0.5">{t1&&<p className="text-[12px] text-[#111827] font-medium">{t1.flag} {t1.name}</p>}{t2&&<p className="text-[12px] text-gray-500">{t2.flag} {t2.name}</p>}{t3&&<p className="text-[12px] text-gray-400">{t3.flag} {t3.name}</p>}</div></div>)
                })}
              </div>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(d: string) { return Math.max(0,Math.ceil((new Date(d).getTime()-Date.now())/86400000)) }
function countGood(bd: ScoreBreakdown) { return [bd.groups,bd.r32,bd.r16,bd.quarters,bd.semis,bd.final,bd.thirdPlace].filter(v=>v>0).length }
const T_START = '2026-06-11'

// ─── Page v2 ──────────────────────────────────────────────────────────────────

export default function ClassementPage() {
  const { player } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<RankEntry | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  const days = daysUntil(T_START)

  useEffect(()=>{
    async function load() {
      try {
        const [rR,pR,plR,mR] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('tournament_results').select('data').limit(1).maybeSingle(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('bracket_predictions').select('player_id, data'),
          supabase.from('players').select('id, pseudo'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('matches').select('id',{count:'exact',head:true}).not('score_home','is',null),
        ])
        if (plR.error) throw plR.error
        setMatchCount(mR.count??0)
        const real:BracketData=migrateData(rR.data?.data??null)
        const preds:{player_id:string;data:unknown}[]=pR.error?[]:(pR.data??[])
        const players:Pick<Player,'id'|'pseudo'>[]=plR.data??[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyR=real.r32.some((x:any)=>x!==null)||Object.values(real.groupQualified).some((q:any)=>q[0]!==0||q[1]!==1)
        setHasResults(anyR)
        const pm=new Map(preds.map(p=>[p.player_id,migrateData(p.data)]))
        const ranked:RankEntry[]=players.map(p=>{const bd=pm.get(p.id)??null;return{player_id:p.id,pseudo:p.pseudo,breakdown:bd?calculateScore(bd,real):{groups:0,r32:0,r16:0,quarters:0,semis:0,final:0,thirdPlace:0,total:0},champion:bd?getChampion(bd):null,bracketData:bd}})
        if(anyR) ranked.sort((a,b)=>b.breakdown.total-a.breakdown.total); else ranked.sort((a,b)=>a.pseudo.localeCompare(b.pseudo))
        setEntries(ranked)
      } catch(e){console.error(e)} finally{setLoading(false)}
    }
    load()
  },[])

  const me=entries.find(e=>e.player_id===player?.id)
  const myRank=hasResults?entries.findIndex(e=>e.player_id===player?.id)+1:0
  const leader=entries[0], second=entries[1]
  const gap=leader&&second?leader.breakdown.total-second.breakdown.total:0
  const amLeader=leader?.player_id===player?.id
  const gapVal=amLeader?gap:(me&&leader?leader.breakdown.total-me.breakdown.total:0)
  const gapSub=amLeader?second?.pseudo:leader?.pseudo

  const champMap=useMemo(()=>{
    const m=new Map<string,{flag:string;count:number}>()
    for(const e of entries) if(e.champion){const x=m.get(e.champion.name);x?x.count++:m.set(e.champion.name,{flag:e.champion.flag,count:1})}
    return [...m.entries()].sort((a,b)=>b[1].count-a[1].count)
  },[entries])

  const noChamp=entries.filter(e=>!e.bracketData).length
  const submitted=entries.filter(e=>e.bracketData).length
  const uniqueChamp=champMap.length
  const bestPlayer=useMemo(()=>{if(!hasResults||!entries.length)return null;return entries.reduce((b,e)=>countGood(e.breakdown)>countGood(b.breakdown)?e:b,entries[0])},[entries,hasResults])
  const bestGood=bestPlayer?countGood(bestPlayer.breakdown):0

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-white" style={{minHeight:'100%'}}>
    <div style={{maxWidth:1440,margin:'0 auto'}}>

    {/* ═══════════════════════════════════════════════════════════════════════
        ROW 1: TITLE (left) + STATS CARD (right)  —  same white band
    ═══════════════════════════════════════════════════════════════════════ */}
    <div className="border-b border-gray-200 px-10 pt-8 pb-6 flex items-start justify-between gap-8">

      {/* Left: title block */}
      <div>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'#003087',marginBottom:2}}>FIFA World Cup 2026</p>
        <h1 className="font-condensed" style={{fontSize:60,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.02em',lineHeight:1,color:'#111827',marginBottom:8}}>Classement</h1>
        <p style={{fontSize:13,color:'#6b7280',maxWidth:380,lineHeight:1.5}}>
          {hasResults?"Les scores sont calculés dès le coup d'envoi du tournoi. Cliquez sur un nom pour voir son pronostic complet.":"Clique sur un nom pour voir son pronostic complet."}
        </p>
      </div>

      {/* Right: stats pill card */}
      <div style={{display:'flex',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)',background:'#fff',flexShrink:0,alignSelf:'flex-start'}}>
        {[
          {Icon:Users, val:String(entries.length), label:'joueurs', iconCls:'text-gray-400'},
          {Icon:Target, val:String(matchCount), label:'matchs joués', iconCls:'text-gray-400'},
          {Icon:Calendar, val:days===0?"Auj.":`${days}`, label:days===0?'jour J':`jour${days>1?'s':''} avant le début`, iconCls:'text-gray-400'},
          {Icon:Trophy, val:String(uniqueChamp), label:'champions différents', iconCls:'text-[#f5a623]'},
        ].map(({Icon,val,label,iconCls},i,a)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'16px 20px',borderRight:i<a.length-1?'1px solid #e5e7eb':'none'}}>
            <Icon size={22} className={iconCls} strokeWidth={1.8}/>
            <div>
              <p className="font-condensed" style={{fontSize:27,fontWeight:800,color:'#111827',lineHeight:1,letterSpacing:'-0.01em'}}>{val}</p>
              {label&&<p style={{fontSize:10,fontWeight:500,color:'#9ca3af',lineHeight:1.15,marginTop:4,textTransform:'uppercase',letterSpacing:'0.04em'}}>{label}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>

    {loading?(
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200}}>
        <div className="w-6 h-6 border-2 border-[#003087] border-t-transparent rounded-full animate-spin"/>
      </div>
    ):entries.length===0?(
      <div style={{padding:'80px 40px',textAlign:'center',color:'#9ca3af',fontSize:14}}>Aucun participant pour l'instant.</div>
    ):<>

    {/* ═══════════════════════════════════════════════════════════════════════
        ROW 2: PODIUM — full content width, 3 equal-ish columns
        The 1st-place card is taller via natural card height, not paddingTop
    ═══════════════════════════════════════════════════════════════════════ */}
    {entries.length>=1&&(
    <div className="border-b border-gray-100" style={{padding:'26px 40px',background:'linear-gradient(180deg,#fafbfc 0%,#fff 100%)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr',gap:16,alignItems:'end'}}>

        {/* 2nd place */}
        <div style={{paddingTop:27}}>
          {entries[1]?(
          <button onClick={()=>setSel(entries[1])} style={{width:'100%',background:'linear-gradient(180deg,#ffffff 0%,#f3f5f8 100%)',border:'1px solid #e2e6ec',borderRadius:20,padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',boxShadow:'0 4px 14px rgba(120,130,150,.12)',transition:'transform .15s, box-shadow .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(120,130,150,.2)';e.currentTarget.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 4px 14px rgba(120,130,150,.12)';e.currentTarget.style.transform='none'}}>
            <div style={{marginBottom:14}}><Medal rank={2} size={42}/></div>
            <div style={{width:44,height:44,borderRadius:'50%',background:avColor(entries[1].pseudo),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'white',fontSize:16,marginBottom:10,boxShadow:'0 2px 6px rgba(0,0,0,.12)'}}>{initials(entries[1].pseudo)}</div>
            <p className="font-condensed" style={{fontSize:20,fontWeight:700,color:'#111827',marginBottom:4}}>{entries[1].pseudo}</p>
            {entries[1].champion?<p style={{fontSize:13,color:'#6b7280',marginBottom:14}}>{entries[1].champion.flag} {entries[1].champion.name}</p>:<p style={{fontSize:13,color:'#d1d5db',marginBottom:14}}>—</p>}
            <div style={{background:'#eef1f5',borderRadius:9999,padding:'6px 18px'}}><span className="font-condensed" style={{fontSize:24,fontWeight:800,color:'#475569',lineHeight:1}}>{entries[1].breakdown.total}</span><span style={{fontSize:12,fontWeight:500,color:'#94a3b8',marginLeft:4}}>pts</span></div>
          </button>):null}
        </div>

        {/* 1st place — tallest card */}
        <button onClick={()=>setSel(entries[0])} style={{width:'100%',background:'linear-gradient(180deg,#fef6d8 0%,#fffdf4 55%,#fff 100%)',border:'2px solid #e8c030',borderRadius:22,padding:'14px 16px 24px',display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',boxShadow:'0 10px 34px rgba(245,166,35,.26), 0 0 0 4px rgba(245,166,35,.08)',transition:'transform .15s, box-shadow .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 14px 42px rgba(245,166,35,.36), 0 0 0 4px rgba(245,166,35,.12)';e.currentTarget.style.transform='translateY(-3px)'}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 10px 34px rgba(245,166,35,.26), 0 0 0 4px rgba(245,166,35,.08)';e.currentTarget.style.transform='none'}}>
          <Laurels sz={52}/>
          <div style={{width:58,height:58,borderRadius:'50%',background:avColor(entries[0].pseudo),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'white',fontSize:20,marginBottom:10,boxShadow:'0 4px 14px rgba(0,0,0,.18)',border:'3px solid #fff'}}>{initials(entries[0].pseudo)}</div>
          <p className="font-condensed" style={{fontSize:27,fontWeight:800,color:'#111827',marginBottom:4}}>{entries[0].pseudo}</p>
          {entries[0].champion?<p style={{fontSize:14,fontWeight:600,color:'#d97706',marginBottom:16}}>{entries[0].champion.flag} {entries[0].champion.name}</p>:<p style={{fontSize:14,color:'#d1d5db',marginBottom:16}}>—</p>}
          <div style={{background:'linear-gradient(135deg,#003087 0%,#00214d 100%)',borderRadius:9999,padding:'11px 36px',boxShadow:'0 4px 14px rgba(0,48,135,.3)'}}>
            <span className="font-condensed" style={{fontSize:26,fontWeight:800,color:'white',lineHeight:1}}>{entries[0].breakdown.total}</span><span className="font-condensed" style={{fontSize:14,fontWeight:600,color:'rgba(255,255,255,.7)',marginLeft:5}}>pts</span>
          </div>
        </button>

        {/* 3rd place */}
        <div style={{paddingTop:44}}>
          {entries[2]?(
          <button onClick={()=>setSel(entries[2])} style={{width:'100%',background:'linear-gradient(180deg,#fffbf6 0%,#fdf1e6 100%)',border:'1px solid #f1d6bb',borderRadius:20,padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',boxShadow:'0 4px 14px rgba(200,120,50,.14)',transition:'transform .15s, box-shadow .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(200,120,50,.22)';e.currentTarget.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 4px 14px rgba(200,120,50,.14)';e.currentTarget.style.transform='none'}}>
            <div style={{marginBottom:14}}><Medal rank={3} size={42}/></div>
            <div style={{width:44,height:44,borderRadius:'50%',background:avColor(entries[2].pseudo),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'white',fontSize:16,marginBottom:10,boxShadow:'0 2px 6px rgba(0,0,0,.12)'}}>{initials(entries[2].pseudo)}</div>
            <p className="font-condensed" style={{fontSize:20,fontWeight:700,color:'#111827',marginBottom:4}}>{entries[2].pseudo}</p>
            {entries[2].champion?<p style={{fontSize:13,color:'#6b7280',marginBottom:14}}>{entries[2].champion.flag} {entries[2].champion.name}</p>:<p style={{fontSize:13,color:'#d1d5db',marginBottom:14}}>—</p>}
            <div style={{background:'#fdf0e4',borderRadius:9999,padding:'6px 18px'}}><span className="font-condensed" style={{fontSize:24,fontWeight:800,color:'#b87333',lineHeight:1}}>{entries[2].breakdown.total}</span><span style={{fontSize:12,fontWeight:500,color:'#cd9b6f',marginLeft:4}}>pts</span></div>
          </button>):null}
        </div>
      </div>
    </div>
    )}

    {/* ═══════════════════════════════════════════════════════════════════════
        ROW 3: LEADERBOARD TABLE (left, ~75%) + SIDEBAR (right, ~25%)
        Sidebar is INDEPENDENT of the podium — starts at this row only
    ═══════════════════════════════════════════════════════════════════════ */}
    <div style={{padding:'0 40px',display:'flex',alignItems:'flex-start',gap:24,paddingTop:24,paddingBottom:0}}>

      {/* ── LEADERBOARD — card-style rows (ESPN Fantasy / Sofascore feel) ──── */}
      <div style={{flex:1,minWidth:0}}>

        {/* Column header strip */}
        <div style={{display:'grid',gridTemplateColumns:'64px 1fr 110px 170px 110px',alignItems:'center',padding:'4px 20px 10px',gap:8}}>
          {['#','JOUEUR','POINTS','CHAMPION','ÉVOLUTION'].map((h,i)=>(
            <span key={h} style={{fontSize:10,fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase',color:'#9ca3af',textAlign:i>=2?'center':'left'}}>{h}</span>
          ))}
        </div>

        {/* Card rows */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {entries.map((entry,i)=>{
            const rank=i+1
            const isMe=entry.player_id===player?.id
            const trd=trend(entry.breakdown.total,rank)
            const delta=rank===1?1:rank===2?-1:rank===4?1:rank===5?-1:0
            const dirColor=delta>0?'#16a34a':delta<0?'#dc2626':'#9ca3af'
            return (
              <div key={entry.player_id}
                style={{
                  display:'grid',gridTemplateColumns:'64px 1fr 110px 170px 110px',alignItems:'center',gap:8,
                  minHeight:68,padding:'0 20px',borderRadius:12,
                  background:'#fff',
                  border:isMe?'1.5px solid #003087':'1px solid #eef0f3',
                  boxShadow:isMe?'0 2px 10px rgba(0,48,135,.12)':'0 1px 4px rgba(0,0,0,.05)',
                  cursor:'pointer',transition:'transform .12s, box-shadow .12s',
                }}
                onMouseEnter={e=>{const t=e.currentTarget as HTMLElement;t.style.transform='translateY(-1px)';t.style.boxShadow='0 6px 18px rgba(0,0,0,.1)'}}
                onMouseLeave={e=>{const t=e.currentTarget as HTMLElement;t.style.transform='none';t.style.boxShadow=isMe?'0 2px 10px rgba(0,48,135,.12)':'0 1px 4px rgba(0,0,0,.05)'}}
                onClick={()=>setSel(entry)}>

                {/* Rank medal — realistic gold/silver/bronze, identical to podium */}
                <div style={{display:'flex',alignItems:'center'}}>
                  <Medal rank={rank} size={36}/>
                </div>

                {/* Player — larger avatar */}
                <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:avColor(entry.pseudo),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'white',fontSize:16,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,.15)'}}>{initials(entry.pseudo)}</div>
                  <div style={{minWidth:0,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:15,fontWeight:700,color:isMe?'#003087':'#111827'}}>{entry.pseudo}</span>
                    {isMe&&<span style={{fontSize:10,fontWeight:600,color:'#fff',background:'#003087',padding:'2px 8px',borderRadius:9999,lineHeight:1.4,textTransform:'uppercase',letterSpacing:'0.05em'}}>moi</span>}
                    {!entry.bracketData&&<span style={{fontSize:10,color:'#d1d5db',fontStyle:'italic'}}>Non soumis</span>}
                  </div>
                </div>

                {/* Points — prominent blue */}
                <div style={{textAlign:'center'}}>
                  {hasResults?(
                    <span style={{fontFamily:'inherit',display:'inline-flex',alignItems:'baseline',gap:3}}>
                      <strong style={{fontSize:22,fontWeight:800,color:isMe?'#c8102e':'#003087',fontFamily:'inherit',lineHeight:1}}>{entry.breakdown.total}</strong>
                      <span style={{fontSize:11,color:'#9ca3af'}}>pts</span>
                    </span>
                  ):<span style={{fontSize:15,color:'#e5e7eb'}}>—</span>}
                </div>

                {/* Champion — pill badge */}
                <div style={{display:'flex',justifyContent:'center'}}>
                  {entry.champion?(
                    <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'#f3f4f6',borderRadius:9999,padding:'5px 12px',fontSize:12,fontWeight:600,color:'#374151',maxWidth:'100%'}}>
                      <span style={{fontSize:14}}>{entry.champion.flag}</span>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.champion.name}</span>
                    </span>
                  ):<span style={{fontSize:12,color:'#c7cbd1'}}>—</span>}
                </div>

                {/* Évolution — arrow + sparkline */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  {hasResults?(
                    <>
                      <span style={{display:'inline-flex',alignItems:'center',gap:2,fontSize:13,fontWeight:700,color:dirColor}}>
                        <span style={{fontSize:15,lineHeight:1}}>{delta>0?'↗':delta<0?'↘':'→'}</span>
                        {delta!==0&&<span style={{fontSize:11}}>{Math.abs(delta)}</span>}
                      </span>
                      <Spark pts={trd} color={dirColor} w={44} h={20}/>
                    </>
                  ):<span style={{fontSize:12,color:'#e5e7eb'}}>—</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Barème — sits directly below the cards */}
        <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'0 4px',padding:'20px 4px 24px',fontSize:12,color:'#6b7280'}}>
          <span style={{fontWeight:600,color:'#4b5563',marginRight:4}}>Barème :</span>
          {[['Groupe','2 pts'],['16e','2 pts'],['1/8','5 pts'],['Quart','10 pts'],['Demi','15 pts'],['Finale','25 pts'],['3e place','10 pts']].map(([l,v],i,a)=>(
            <span key={l} style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{color:'#6b7280'}}>{l}</span>
              <strong style={{fontWeight:600,color:'#003087'}}>{v}</strong>
              {i<a.length-1&&<span style={{color:'#d1d5db',margin:'0 4px'}}>|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <div style={{width:280,flexShrink:0,display:'flex',flexDirection:'column',gap:16,paddingBottom:24}}>

        {/* Champions choisis */}
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #f3f4f6',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:16}}>👑</span>
            <span className="font-condensed" style={{fontSize:14,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#111827'}}>Champions choisis</span>
          </div>
          <div>
            {champMap.map(([name,{flag,count}])=>(
              <div key={name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderBottom:'1px solid #f9fafb'}}>
                <span style={{fontSize:13,color:'#111827',display:'flex',alignItems:'center',gap:8}}>{flag} {name}</span>
                <span className="font-condensed" style={{fontSize:15,fontWeight:700,color:'#111827'}}>{count}</span>
              </div>
            ))}
            {noChamp>0&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px'}}>
                <span style={{fontSize:13,color:'#9ca3af'}}>— Aucun</span>
                <span className="font-condensed" style={{fontSize:15,fontWeight:700,color:'#d1d5db'}}>{noChamp}</span>
              </div>
            )}
          </div>
        </div>

        {/* Meilleur joueur */}
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #f3f4f6',display:'flex',alignItems:'center',gap:8}}>
            <span className="font-condensed" style={{fontSize:14,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#111827'}}>Meilleur joueur</span>
            <span style={{fontSize:16}}>🔥</span>
          </div>
          <div style={{padding:'16px',display:'flex',alignItems:'center',gap:14}}>
            <div className="font-condensed" style={{width:52,height:52,borderRadius:'50%',background:'#003087',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,flexShrink:0,boxShadow:'0 3px 10px rgba(0,48,135,.25)'}}>
              {hasResults?bestGood:submitted}
            </div>
            <div>
              {hasResults?(<><p style={{fontSize:12,color:'#9ca3af',marginBottom:2}}>bonnes prédictions</p><p style={{fontSize:15,fontWeight:600,color:'#111827'}}>{bestPlayer?.pseudo??'—'}</p></>):(
                <><p style={{fontSize:15,fontWeight:600,color:'#111827',marginBottom:2}}>{submitted} / {entries.length} prêts</p><p style={{fontSize:12,color:'#9ca3af',lineHeight:1.4}}>brackets soumis — désigné dès le 1er match</p></>
              )}
            </div>
          </div>
        </div>

        {/* Écart avec 2ème */}
        {entries.length>=2&&(
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #f3f4f6'}}>
            <span className="font-condensed" style={{fontSize:14,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#111827'}}>{!hasResults?'Compte à rebours':amLeader?'Mon avance':'Écart avec 2ème'}</span>
          </div>
          <div style={{padding:'16px'}}>
            {hasResults?(
              <>
                <p className="font-condensed" style={{fontSize:32,fontWeight:800,color:'#22c55e',lineHeight:1}}>+{gapVal} pts</p>
                <p style={{fontSize:12,color:'#6b7280',marginTop:4,marginBottom:12}}>({gapSub})</p>
                <Spark pts={[gapVal-4,gapVal-2,gapVal+1,gapVal+4,gapVal+6]} color="#22c55e" w={230} h={44}/>
              </>
            ):(
              <>
                <p className="font-condensed" style={{fontSize:38,fontWeight:800,color:'#003087',lineHeight:1}}>{days}<span style={{fontSize:15,fontWeight:600,color:'#9ca3af',marginLeft:6}}>jour{days>1?'s':''}</span></p>
                <p style={{fontSize:12,color:'#6b7280',marginTop:6,lineHeight:1.5}}>avant le coup d'envoi — tout le monde démarre à <strong style={{color:'#111827'}}>0 pt</strong></p>
              </>
            )}
          </div>
        </div>
        )}

        {/* Mon pronostic (pré-tournoi) */}
        {me&&!hasResults&&(
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #f3f4f6'}}>
            <span className="font-condensed" style={{fontSize:14,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#c8102e'}}>Mon pronostic</span>
          </div>
          <div style={{padding:'16px'}}>
            {me.bracketData?(
              <>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:'#22c55e',flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:600,color:'#111827'}}>Bracket soumis</span>
                </div>
                {me.champion?(
                  <div style={{display:'flex',alignItems:'center',gap:10,background:'#fef9e7',border:'1px solid #f0dca0',borderRadius:12,padding:'10px 14px'}}>
                    <span style={{fontSize:24}}>{me.champion.flag}</span>
                    <div><p style={{fontSize:10,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:1}}>Mon champion</p><p className="font-condensed" style={{fontSize:16,fontWeight:700,color:'#b8860b'}}>{me.champion.name}</p></div>
                  </div>
                ):<p style={{fontSize:12,color:'#9ca3af'}}>Champion non sélectionné</p>}
              </>
            ):(
              <>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:'#f59e0b',flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:600,color:'#111827'}}>Bracket non soumis</span>
                </div>
                <p style={{fontSize:12,color:'#6b7280',lineHeight:1.5}}>Complète ton bracket avant le {new Date(T_START).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})} pour participer.</p>
              </>
            )}
          </div>
        </div>
        )}

        {/* Ma position */}
        {me&&myRank>0&&hasResults&&(
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #f3f4f6'}}>
            <span className="font-condensed" style={{fontSize:14,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#c8102e'}}>Ma position</span>
          </div>
          <div style={{padding:'16px',display:'flex',alignItems:'center',justifyContent:'space-around'}}>
            <div style={{textAlign:'center'}}>
              <p className="font-condensed" style={{fontSize:38,fontWeight:800,color:'#003087',lineHeight:1}}>#{myRank}</p>
              <p style={{fontSize:10,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',marginTop:2}}>rang</p>
            </div>
            <div style={{width:1,height:48,background:'#e5e7eb'}}/>
            <div style={{textAlign:'center'}}>
              <p className="font-condensed" style={{fontSize:38,fontWeight:800,color:'#c8102e',lineHeight:1}}>{me.breakdown.total}</p>
              <p style={{fontSize:10,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.1em',marginTop:2}}>pts</p>
            </div>
          </div>
        </div>
        )}

      </div>
    </div>

    </>}

    {sel && <PlayerModal entry={sel} onClose={() => setSel(null)}/>}
    </div>
    </div>
  )
}
