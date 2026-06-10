import { useState, useEffect, useMemo } from 'react'
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

// ─── Rank badge (circular, colored) ──────────────────────────────────────────

const RANK_BG: Record<number,string> = {
  1:'linear-gradient(135deg,#fada5e 0%,#f5a623 60%,#c87800 100%)',
  2:'linear-gradient(135deg,#d6dde8 0%,#8a95a8 100%)',
  3:'linear-gradient(135deg,#d4924a 0%,#b87333 100%)',
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
          {Icon:Users, val:String(entries.length), label:'joueurs', top:null, iconCls:'text-gray-400'},
          {Icon:Target, val:String(matchCount), label:'matchs joués', top:null, iconCls:'text-gray-400'},
          {Icon:Calendar, val:days===0?"Aujourd'hui":`${days} jour${days>1?'s':''}`, label:null, top:'Début dans', iconCls:'text-gray-400'},
          {Icon:Trophy, val:String(uniqueChamp), label:'champions différents', top:null, iconCls:'text-[#f5a623]'},
        ].map(({Icon,val,label,top,iconCls},i,a)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'16px 20px',borderRight:i<a.length-1?'1px solid #e5e7eb':'none'}}>
            <Icon size={22} className={iconCls} strokeWidth={1.8}/>
            <div>
              {top&&<p style={{fontSize:11,color:'#9ca3af',lineHeight:1,marginBottom:2}}>{top}</p>}
              <p className="font-condensed" style={{fontSize:22,fontWeight:800,color:'#111827',lineHeight:1}}>{val}</p>
              {label&&<p style={{fontSize:11,color:'#9ca3af',lineHeight:1,marginTop:2}}>{label}</p>}
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
    <div className="border-b border-gray-100" style={{padding:'32px 40px',background:'#fff'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr',gap:16,alignItems:'end'}}>

        {/* 2nd place */}
        <div style={{paddingTop:32}}>
          {entries[1]?(
          <button onClick={()=>setSel(entries[1])} style={{width:'100%',background:'#fff',border:'1px solid #e5e7eb',borderRadius:20,padding:'24px 16px',display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,.06)',transition:'box-shadow .15s'}}
            onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.1)')} onMouseLeave={e=>(e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.06)')}>
            <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#d6dde8 0%,#8a95a8 100%)',boxShadow:'0 2px 8px rgba(130,140,158,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'white',fontSize:18,marginBottom:16}}>2</div>
            <div style={{width:44,height:44,borderRadius:'50%',background:avColor(entries[1].pseudo),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'white',fontSize:16,marginBottom:10}}>{initials(entries[1].pseudo)}</div>
            <p className="font-condensed" style={{fontSize:20,fontWeight:700,color:'#111827',marginBottom:4}}>{entries[1].pseudo}</p>
            {entries[1].champion?<p style={{fontSize:13,color:'#6b7280',marginBottom:16}}>{entries[1].champion.flag} {entries[1].champion.name}</p>:<p style={{fontSize:13,color:'#d1d5db',marginBottom:16}}>—</p>}
            <p className="font-condensed" style={{fontSize:22,fontWeight:800,color:'#6b7280'}}>{entries[1].breakdown.total} <span style={{fontSize:13,fontWeight:400,color:'#9ca3af'}}>pts</span></p>
          </button>):null}
        </div>

        {/* 1st place — tallest card */}
        <button onClick={()=>setSel(entries[0])} style={{width:'100%',background:'linear-gradient(180deg,#fef9e7 0%,#fffef8 60%,#fff 100%)',border:'2px solid #e8c030',borderRadius:20,padding:'16px 16px 28px',display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',boxShadow:'0 6px 24px rgba(245,166,35,.18)',transition:'box-shadow .15s'}}
          onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 10px 32px rgba(245,166,35,.28)')} onMouseLeave={e=>(e.currentTarget.style.boxShadow='0 6px 24px rgba(245,166,35,.18)')}>
          <Laurels sz={48}/>
          <div style={{width:52,height:52,borderRadius:'50%',background:avColor(entries[0].pseudo),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'white',fontSize:18,marginBottom:10}}>{initials(entries[0].pseudo)}</div>
          <p className="font-condensed" style={{fontSize:24,fontWeight:800,color:'#111827',marginBottom:4}}>{entries[0].pseudo}</p>
          {entries[0].champion?<p style={{fontSize:14,fontWeight:600,color:'#d97706',marginBottom:20}}>{entries[0].champion.flag} {entries[0].champion.name}</p>:<p style={{fontSize:14,color:'#d1d5db',marginBottom:20}}>—</p>}
          <div style={{background:'#003087',borderRadius:9999,padding:'10px 32px',boxShadow:'0 2px 8px rgba(0,48,135,.2)'}}>
            <span className="font-condensed" style={{fontSize:20,fontWeight:800,color:'white',lineHeight:1}}>{entries[0].breakdown.total} pts</span>
          </div>
        </button>

        {/* 3rd place */}
        <div style={{paddingTop:52}}>
          {entries[2]?(
          <button onClick={()=>setSel(entries[2])} style={{width:'100%',background:'#fff',border:'1px solid #f3d5b5',borderRadius:20,padding:'24px 16px',display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(200,120,50,.1)',transition:'box-shadow .15s'}}
            onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 6px 20px rgba(200,120,50,.18)')} onMouseLeave={e=>(e.currentTarget.style.boxShadow='0 2px 8px rgba(200,120,50,.1)')}>
            <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#d4924a 0%,#b87333 100%)',boxShadow:'0 2px 8px rgba(180,110,40,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'white',fontSize:18,marginBottom:16}}>3</div>
            <div style={{width:44,height:44,borderRadius:'50%',background:avColor(entries[2].pseudo),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'white',fontSize:16,marginBottom:10}}>{initials(entries[2].pseudo)}</div>
            <p className="font-condensed" style={{fontSize:20,fontWeight:700,color:'#111827',marginBottom:4}}>{entries[2].pseudo}</p>
            {entries[2].champion?<p style={{fontSize:13,color:'#6b7280',marginBottom:16}}>{entries[2].champion.flag} {entries[2].champion.name}</p>:<p style={{fontSize:13,color:'#d1d5db',marginBottom:16}}>—</p>}
            <p className="font-condensed" style={{fontSize:22,fontWeight:800,color:'#b87333'}}>{entries[2].breakdown.total} <span style={{fontSize:13,fontWeight:400,color:'#9ca3af'}}>pts</span></p>
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

      {/* ── LEADERBOARD TABLE ───────────────────────────────────────────── */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>

          {/* Table header */}
          <div style={{display:'grid',gridTemplateColumns:'56px 1fr 120px 160px 120px',alignItems:'center',padding:'10px 20px',background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
            {['#','JOUEUR','POINTS','CHAMPION','ÉVOLUTION'].map((h,i)=>(
              <span key={h} style={{fontSize:10,fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase',color:'#9ca3af',textAlign:i>=2?'center':'left'}}>{h}</span>
            ))}
          </div>

          {/* Table rows */}
          {entries.map((entry,i)=>{
            const rank=i+1
            const isMe=entry.player_id===player?.id
            const badgeBg=RANK_BG[rank]
            const accentColor=rank===1?'#f5a623':rank===2?'#9ca3af':rank===3?'#cd7f32':null
            const trd=trend(entry.breakdown.total,rank)
            const delta=rank===1?1:rank===2?-1:rank===4?1:rank===5?-1:0
            return (
              <div key={entry.player_id}
                style={{display:'grid',gridTemplateColumns:'56px 1fr 120px 160px 120px',alignItems:'center',minHeight:56,padding:'0 20px',borderBottom:'1px solid #f3f4f6',borderLeft:accentColor?`3px solid ${accentColor}`:'3px solid transparent',background:isMe?'#fefce8':i%2===1?'#fafafa':'#fff',cursor:'pointer',transition:'background .1s'}}
                onMouseEnter={e=>{if(!isMe)(e.currentTarget as HTMLElement).style.background='#f0f6ff'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=isMe?'#fefce8':i%2===1?'#fafafa':'#fff'}}
                onClick={()=>setSel(entry)}>

                {/* Rank */}
                <div style={{display:'flex',alignItems:'center'}}>
                  {badgeBg?(
                    <div style={{width:28,height:28,borderRadius:'50%',background:badgeBg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'white',fontSize:13,lineHeight:1,fontFamily:'inherit'}}>{rank}</div>
                  ):(
                    <span style={{fontSize:15,fontWeight:600,color:'#d1d5db',paddingLeft:4,fontFamily:'inherit'}}>{rank}</span>
                  )}
                </div>

                {/* Player */}
                <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:avColor(entry.pseudo),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'white',fontSize:13,flexShrink:0}}>{initials(entry.pseudo)}</div>
                  <div style={{minWidth:0,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:14,fontWeight:600,color:isMe?'#003087':'#111827'}}>{entry.pseudo}</span>
                    {isMe&&<span style={{fontSize:10,fontWeight:500,color:'#6b7280',background:'#f3f4f6',padding:'2px 8px',borderRadius:9999,lineHeight:1.4}}>moi</span>}
                    {!entry.bracketData&&<span style={{fontSize:10,color:'#d1d5db',fontStyle:'italic'}}>Non soumis</span>}
                  </div>
                </div>

                {/* Points */}
                <div style={{textAlign:'center'}}>
                  {hasResults?(
                    <span style={{fontFamily:'inherit'}}>
                      <strong style={{fontSize:17,fontWeight:800,color:isMe?'#c8102e':'#111827',fontFamily:'inherit'}}>{entry.breakdown.total}</strong>
                      <span style={{fontSize:12,color:'#9ca3af',marginLeft:3}}>pts</span>
                    </span>
                  ):<span style={{fontSize:15,color:'#e5e7eb'}}>—</span>}
                </div>

                {/* Champion */}
                <div style={{textAlign:'center'}}>
                  {entry.champion?(
                    <span style={{fontSize:13,color:'#374151'}}>{entry.champion.flag} {entry.champion.name}</span>
                  ):<span style={{fontSize:13,color:'#9ca3af'}}>— Aucun</span>}
                </div>

                {/* Évolution */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  {hasResults?(
                    <>
                      <span style={{fontSize:12,fontWeight:700,color:delta>0?'#22c55e':delta<0?'#f87171':'#d1d5db'}}>
                        {delta>0?`▲${delta}`:delta<0?`▼${Math.abs(delta)}`:'—0'}
                      </span>
                      <Spark pts={trd} color="#003087" w={46} h={20}/>
                    </>
                  ):<span style={{fontSize:12,color:'#e5e7eb'}}>—</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Barème — sits directly below the table */}
        <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'0 4px',padding:'16px 4px 24px',fontSize:12,color:'#6b7280'}}>
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
              {hasResults?bestGood:'?'}
            </div>
            <div>
              {hasResults?(<><p style={{fontSize:12,color:'#9ca3af',marginBottom:2}}>bonnes prédictions</p><p style={{fontSize:15,fontWeight:600,color:'#111827'}}>{bestPlayer?.pseudo??'—'}</p></>):(
                <p style={{fontSize:12,color:'#9ca3af',lineHeight:1.5}}>Disponible au lancement du tournoi</p>
              )}
            </div>
          </div>
        </div>

        {/* Écart avec 2ème */}
        {entries.length>=2&&(
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #f3f4f6'}}>
            <span className="font-condensed" style={{fontSize:14,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#111827'}}>{amLeader?'Mon avance':'Écart avec 2ème'}</span>
          </div>
          <div style={{padding:'16px'}}>
            {hasResults?(
              <>
                <p className="font-condensed" style={{fontSize:32,fontWeight:800,color:'#22c55e',lineHeight:1}}>+{gapVal} pts</p>
                <p style={{fontSize:12,color:'#6b7280',marginTop:4,marginBottom:12}}>({gapSub})</p>
                <Spark pts={[gapVal-4,gapVal-2,gapVal+1,gapVal+4,gapVal+6]} color="#22c55e" w={230} h={44}/>
              </>
            ):<p style={{fontSize:13,color:'#9ca3af',padding:'4px 0'}}>Disponible au lancement du tournoi</p>}
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
