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
import { PageContainer } from '../components/ui/PageContainer'
import { PageTitle } from '../components/ui/PageTitle'
import { InfoWidget } from '../components/ui/InfoWidget'
import { StatCard, StatCardGroup } from '../components/ui/StatCard'
import { Medal } from '../components/ui/Medal'
import { avatarColor, initials } from '../components/ui/tokens'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RankEntry {
  player_id: string
  pseudo: string
  breakdown: ScoreBreakdown
  champion: { name: string; flag: string } | null
  bracketData: BracketData | null
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────
// Moved to components/ui/tokens.ts — imported above as { avatarColor, initials }

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Spark({ pts, color='#003087', w=52, h=20 }: { pts:number[]; color?:string; w?:number; h?:number }) {
  if (pts.length < 2) return null
  const mn=Math.min(...pts), mx=Math.max(...pts), rng=mx-mn||1
  const d=pts.map((v,i)=>{const x=(i/(pts.length-1))*w; const y=h-2-((v-mn)/rng)*(h-4); return `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`}).join(' ')
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
        <div className="px-5 py-4 flex items-center justify-between shrink-0 bg-brand-navy">
          <div className="flex items-center gap-3">
            <div className="rounded-full flex items-center justify-center font-black text-[14px] uppercase text-white" style={{width:36,height:36,background:avatarColor(entry.pseudo)}}>{initials(entry.pseudo)}</div>
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
    <PageContainer width="xl">

    {/* ═══════════════════════════════════════════════════════════════════════
        ROW 1: TITLE (left) + STATS CARD (right)  —  same white band
    ═══════════════════════════════════════════════════════════════════════ */}
    <PageTitle
      eyebrow="FIFA World Cup 2026"
      title="Classement"
      subtitle={hasResults
        ? "Les scores sont calculés dès le coup d'envoi du tournoi. Cliquez sur un nom pour voir son pronostic complet."
        : 'Clique sur un nom pour voir son pronostic complet.'}
      action={
        <StatCardGroup className="w-full lg:w-auto">
          <StatCard icon={<Users size={28} strokeWidth={1.8} />} value={entries.length} label="joueurs" />
          <StatCard icon={<Target size={28} strokeWidth={1.8} />} value={matchCount} label="matchs joués" />
          <StatCard icon={<Calendar size={28} strokeWidth={1.8} />} value={days === 0 ? 'Auj.' : days} label={days === 0 ? 'jour J' : `jour${days > 1 ? 's' : ''} avant le début`} />
          <StatCard icon={<Trophy size={28} strokeWidth={1.8} />} value={uniqueChamp} label="champions différents" accent="gold" />
        </StatCardGroup>
      }
    />

    {loading?(
      <div className="flex items-center justify-center h-[200px]">
        <div className="w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full animate-spin"/>
      </div>
    ):entries.length===0?(
      <div className="px-10 py-20 text-center text-[14px] text-gray-400">Aucun participant pour l'instant.</div>
    ):<>

    {/* ═══════════════════════════════════════════════════════════════════════
        ROW 2: PODIUM — full content width, 3 equal-ish columns
        The 1st-place card is taller via natural card height, not paddingTop
    ═══════════════════════════════════════════════════════════════════════ */}
    {entries.length>=1&&(
    <div className="border-b border-gray-100 bg-gradient-to-b from-[#fafbfc] to-white px-5 py-9 md:px-10 md:py-12">
      <div className="mx-auto grid max-w-[980px] items-end gap-4 md:gap-6" style={{gridTemplateColumns:'1fr 1.32fr 1fr'}}>

        {/* 2nd place */}
        <div className="pt-9">
          {entries[1]?(
          <button onClick={()=>setSel(entries[1])} className="flex w-full flex-col items-center rounded-[22px] border border-[#e2e6ec] bg-gradient-to-b from-white to-[#f3f5f8] px-4 py-7 shadow-[0_6px_18px_rgba(120,130,150,0.14)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(120,130,150,0.22)] md:px-5">
            <div className="mb-4"><Medal rank={2} size={52}/></div>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full text-[20px] font-900 text-white shadow-[0_2px_8px_rgba(0,0,0,0.14)]" style={{background:avatarColor(entries[1].pseudo)}}>{initials(entries[1].pseudo)}</div>
            <p className="font-condensed mb-1 text-[25px] font-700 text-gray-900">{entries[1].pseudo}</p>
            {entries[1].champion?<p className="mb-4 text-[14px] text-gray-500">{entries[1].champion.flag} {entries[1].champion.name}</p>:<p className="mb-4 text-[14px] text-gray-300">—</p>}
            <div className="rounded-full bg-[#eef1f5] px-5 py-2"><span className="font-condensed text-[28px] font-800 leading-none text-[#475569]">{entries[1].breakdown.total}</span><span className="ml-1 text-[13px] font-500 text-[#94a3b8]">pts</span></div>
          </button>):null}
        </div>

        {/* 1st place — tallest card */}
        <button onClick={()=>setSel(entries[0])} className="flex w-full flex-col items-center rounded-[26px] border-2 border-[#e8c030] bg-gradient-to-b from-[#fef6d8] via-[#fffdf4] to-white px-4 pb-9 pt-4 shadow-[0_16px_44px_rgba(245,166,35,0.32),0_0_0_5px_rgba(245,166,35,0.09)] transition duration-150 hover:-translate-y-[3px] hover:shadow-[0_20px_56px_rgba(245,166,35,0.42),0_0_0_5px_rgba(245,166,35,0.14)] md:px-6">
          <Laurels sz={66}/>
          <div className="mb-3 flex h-[78px] w-[78px] items-center justify-center rounded-full border-4 border-white text-[28px] font-900 text-white shadow-[0_6px_18px_rgba(0,0,0,0.2)]" style={{background:avatarColor(entries[0].pseudo)}}>{initials(entries[0].pseudo)}</div>
          <p className="font-condensed mb-1.5 text-[38px] font-800 leading-none text-gray-900">{entries[0].pseudo}</p>
          {entries[0].champion?<p className="mb-5 text-[16px] font-600 text-[#d97706]">{entries[0].champion.flag} {entries[0].champion.name}</p>:<p className="mb-5 text-[16px] text-gray-300">—</p>}
          <div className="rounded-full bg-gradient-to-br from-brand-navy to-[#00214d] px-11 py-3.5 shadow-[0_6px_18px_rgba(0,48,135,0.34)]">
            <span className="font-condensed text-[34px] font-800 leading-none text-white">{entries[0].breakdown.total}</span><span className="font-condensed ml-1.5 text-[16px] font-600 text-white/70">pts</span>
          </div>
        </button>

        {/* 3rd place */}
        <div className="pt-14">
          {entries[2]?(
          <button onClick={()=>setSel(entries[2])} className="flex w-full flex-col items-center rounded-[22px] border border-[#f1d6bb] bg-gradient-to-b from-[#fffbf6] to-[#fdf1e6] px-4 py-7 shadow-[0_6px_18px_rgba(200,120,50,0.16)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(200,120,50,0.24)] md:px-5">
            <div className="mb-4"><Medal rank={3} size={52}/></div>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full text-[20px] font-900 text-white shadow-[0_2px_8px_rgba(0,0,0,0.14)]" style={{background:avatarColor(entries[2].pseudo)}}>{initials(entries[2].pseudo)}</div>
            <p className="font-condensed mb-1 text-[25px] font-700 text-gray-900">{entries[2].pseudo}</p>
            {entries[2].champion?<p className="mb-4 text-[14px] text-gray-500">{entries[2].champion.flag} {entries[2].champion.name}</p>:<p className="mb-4 text-[14px] text-gray-300">—</p>}
            <div className="rounded-full bg-[#fdf0e4] px-5 py-2"><span className="font-condensed text-[28px] font-800 leading-none text-[#b87333]">{entries[2].breakdown.total}</span><span className="ml-1 text-[13px] font-500 text-[#cd9b6f]">pts</span></div>
          </button>):null}
        </div>
      </div>
    </div>
    )}

    {/* ═══════════════════════════════════════════════════════════════════════
        ROW 3: LEADERBOARD TABLE (left, ~75%) + SIDEBAR (right, ~25%)
        Sidebar is INDEPENDENT of the podium — starts at this row only
    ═══════════════════════════════════════════════════════════════════════ */}
    <div className="flex flex-col gap-6 px-5 pt-7 md:px-10 lg:flex-row lg:items-start lg:gap-8">

      {/* ── LEADERBOARD — card-style rows (ESPN Fantasy / Sofascore feel) ──── */}
      <div className="w-full min-w-0 lg:flex-1">

        {/* Column header strip — desktop only */}
        <div className="hidden grid-cols-[64px_1fr_110px_170px_110px] items-center gap-2 px-5 pb-2.5 pt-1 sm:grid">
          {['#','JOUEUR','POINTS','CHAMPION','ÉVOLUTION'].map((h,i)=>(
            <span key={h} className={`text-[10px] font-600 uppercase tracking-[0.15em] text-gray-400 ${i>=2?'text-center':'text-left'}`}>{h}</span>
          ))}
        </div>

        {/* Card rows */}
        <div className="flex flex-col gap-3.5">
          {entries.map((entry,i)=>{
            const rank=i+1
            const isMe=entry.player_id===player?.id
            const delta=rank===1?1:rank===2?-1:rank===4?1:rank===5?-1:0
            return (
              <div key={entry.player_id}
                onClick={()=>setSel(entry)}
                className={`grid min-h-[80px] cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-2 rounded-xl bg-white px-4 shadow-card transition duration-150 hover:-translate-y-px hover:shadow-card-hover sm:grid-cols-[64px_1fr_110px_170px_110px] sm:px-6 ${isMe?'border-[1.5px] border-brand-navy shadow-[0_2px_10px_rgba(0,48,135,0.12)]':'border border-[#eef0f3]'}`}>

                {/* Rank medal — realistic gold/silver/bronze, identical to podium */}
                <div className="flex items-center"><Medal rank={rank} size={40}/></div>

                {/* Player — larger avatar */}
                <div className="flex min-w-0 items-center gap-3.5 py-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-[17px] font-900 text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]" style={{background:avatarColor(entry.pseudo)}}>{initials(entry.pseudo)}</div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[15px] font-700 ${isMe?'text-brand-navy':'text-gray-900'}`}>{entry.pseudo}</span>
                      {isMe&&<span className="rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-600 uppercase leading-snug tracking-[0.05em] text-white">moi</span>}
                      {!entry.bracketData&&<span className="text-[10px] italic text-gray-300">Non soumis</span>}
                    </div>
                    {/* Mobile-only: champion + evolution folded under name */}
                    <div className="flex items-center gap-2 sm:hidden">
                      {entry.champion?<span className="text-[11px] text-gray-500">{entry.champion.flag} {entry.champion.name}</span>:<span className="text-[11px] text-gray-300">—</span>}
                      {hasResults&&<span className={`text-[11px] font-700 ${delta>0?'text-green-700':delta<0?'text-red-700':'text-gray-500'}`}>{delta>0?`↗+${delta}`:delta<0?`↘${delta}`:'→0'}</span>}
                    </div>
                  </div>
                </div>

                {/* Points — prominent blue */}
                <div className="pr-1 text-right sm:pr-0 sm:text-center">
                  {hasResults?(
                    <span className="inline-flex items-baseline gap-[3px]">
                      <strong className={`text-[22px] font-800 leading-none ${isMe?'text-brand-red':'text-brand-navy'}`}>{entry.breakdown.total}</strong>
                      <span className="text-[11px] text-gray-400">pts</span>
                    </span>
                  ):<span className="text-[15px] text-gray-200">—</span>}
                </div>

                {/* Champion — pill badge (desktop) */}
                <div className="hidden justify-center sm:flex">
                  {entry.champion?(
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 px-3 py-[5px] text-[12px] font-600 text-gray-700">
                      <span className="text-[14px]">{entry.champion.flag}</span>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{entry.champion.name}</span>
                    </span>
                  ):<span className="text-[12px] text-[#c7cbd1]">—</span>}
                </div>

                {/* Évolution — compact rounded badge (desktop) */}
                <div className="hidden items-center justify-center sm:flex">
                  {hasResults?(
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-700 leading-none ${delta>0?'border-green-200 bg-green-100 text-green-700':delta<0?'border-red-200 bg-red-100 text-red-700':'border-[#e3e6ea] bg-[#f1f3f5] text-gray-500'}`}>
                      <span className="text-[13px] leading-none">{delta>0?'↗':delta<0?'↘':'→'}</span>
                      <span>{delta>0?`+${delta}`:delta<0?`${delta}`:'0'}</span>
                    </span>
                  ):(
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e6ea] bg-[#f1f3f5] px-2.5 py-1 text-[11px] font-600 leading-none text-gray-500">
                      <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[#cbd2da]"/>
                      Initial
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Barème — sits directly below the cards */}
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 px-1 pb-6 pt-5 text-[12px] text-gray-500">
          <span className="mr-1 font-600 text-gray-600">Barème :</span>
          {[['Groupe','2 pts'],['16e','2 pts'],['1/8','5 pts'],['Quart','10 pts'],['Demi','15 pts'],['Finale','25 pts'],['3e place','10 pts']].map(([l,v],i,a)=>(
            <span key={l} className="flex items-center gap-1">
              <span className="text-gray-500">{l}</span>
              <strong className="font-600 text-brand-navy">{v}</strong>
              {i<a.length-1&&<span className="mx-1 text-gray-300">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <div className="flex w-full flex-shrink-0 flex-col gap-4 pb-6 lg:w-[320px]">

        {/* Champions choisis */}
        <InfoWidget title="Champions choisis" icon={<span className="text-[16px]">👑</span>}>
          {champMap.map(([name,{flag,count}])=>(
            <div key={name} className="flex items-center justify-between border-b border-[#f9fafb] px-4 py-2.5">
              <span className="flex items-center gap-2 text-[13px] text-gray-900">{flag} {name}</span>
              <span className="font-condensed text-[15px] font-700 text-gray-900">{count}</span>
            </div>
          ))}
          {noChamp>0&&(
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[13px] text-gray-400">— Aucun</span>
              <span className="font-condensed text-[15px] font-700 text-gray-300">{noChamp}</span>
            </div>
          )}
        </InfoWidget>

        {/* Meilleur joueur */}
        <InfoWidget title="Meilleur joueur" icon={<span className="text-[16px]">🔥</span>}>
          <div className="flex items-center gap-3.5 p-4">
            <div className="font-condensed flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-[22px] font-800 text-white shadow-[0_3px_10px_rgba(0,48,135,0.25)]">
              {hasResults?bestGood:submitted}
            </div>
            <div>
              {hasResults?(<><p className="mb-0.5 text-[12px] text-gray-400">bonnes prédictions</p><p className="text-[15px] font-600 text-gray-900">{bestPlayer?.pseudo??'—'}</p></>):(
                <><p className="mb-0.5 text-[15px] font-600 text-gray-900">{submitted} / {entries.length} prêts</p><p className="text-[12px] leading-snug text-gray-400">brackets soumis — désigné dès le 1er match</p></>
              )}
            </div>
          </div>
        </InfoWidget>

        {/* Écart avec 2ème */}
        {entries.length>=2&&(
        <InfoWidget title={!hasResults?'Compte à rebours':amLeader?'Mon avance':'Écart avec 2ème'}>
          <div className="p-4">
            {hasResults?(
              <>
                <p className="font-condensed text-[32px] font-800 leading-none text-green-500">+{gapVal} pts</p>
                <p className="mb-3 mt-1 text-[12px] text-gray-500">({gapSub})</p>
                <Spark pts={[gapVal-4,gapVal-2,gapVal+1,gapVal+4,gapVal+6]} color="#22c55e" w={230} h={44}/>
              </>
            ):(
              <>
                <p className="font-condensed text-[38px] font-800 leading-none text-brand-navy">{days}<span className="ml-1.5 text-[15px] font-600 text-gray-400">jour{days>1?'s':''}</span></p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">avant le coup d'envoi — tout le monde démarre à <strong className="text-gray-900">0 pt</strong></p>
              </>
            )}
          </div>
        </InfoWidget>
        )}

        {/* Mon pronostic (pré-tournoi) */}
        {me&&!hasResults&&(
        <InfoWidget title="Mon pronostic" accent="red">
          <div className="p-4">
            {me.bracketData?(
              <>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500"/>
                  <span className="text-[13px] font-600 text-gray-900">Bracket soumis</span>
                </div>
                {me.champion?(
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#f0dca0] bg-[#fef9e7] px-3.5 py-2.5">
                    <span className="text-[24px]">{me.champion.flag}</span>
                    <div><p className="mb-px text-[10px] uppercase tracking-[0.08em] text-gray-400">Mon champion</p><p className="font-condensed text-[16px] font-700 text-[#b8860b]">{me.champion.name}</p></div>
                  </div>
                ):<p className="text-[12px] text-gray-400">Champion non sélectionné</p>}
              </>
            ):(
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-500"/>
                  <span className="text-[13px] font-600 text-gray-900">Bracket non soumis</span>
                </div>
                <p className="text-[12px] leading-relaxed text-gray-500">Complète ton bracket avant le {new Date(T_START).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})} pour participer.</p>
              </>
            )}
          </div>
        </InfoWidget>
        )}

        {/* Ma position */}
        {me&&myRank>0&&hasResults&&(
        <InfoWidget title="Ma position" accent="red">
          <div className="flex items-center justify-around p-4">
            <div className="text-center">
              <p className="font-condensed text-[38px] font-800 leading-none text-brand-navy">#{myRank}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-gray-400">rang</p>
            </div>
            <div className="h-12 w-px bg-gray-200"/>
            <div className="text-center">
              <p className="font-condensed text-[38px] font-800 leading-none text-brand-red">{me.breakdown.total}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-gray-400">pts</p>
            </div>
          </div>
        </InfoWidget>
        )}

      </div>
    </div>

    </>}

    {sel && <PlayerModal entry={sel} onClose={() => setSel(null)}/>}
    </PageContainer>
  )
}

