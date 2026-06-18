import type { Match } from '../types'
import { DEFAULT_DATA, GROUP_TEAMS, type BracketData } from './bracketData'

export interface StandingRow {
  name: string
  flag: string
  played: number
  win: number
  draw: number
  loss: number
  gf: number
  ga: number
  gd: number
  pts: number
}

function cloneDefaultBracketData(): BracketData {
  return {
    groupQualified: { ...DEFAULT_DATA.groupQualified },
    bestThirds: [],
    r32: [...DEFAULT_DATA.r32],
    r16: [...DEFAULT_DATA.r16],
    quarters: [...DEFAULT_DATA.quarters],
    semis: [...DEFAULT_DATA.semis],
    final: DEFAULT_DATA.final,
    thirdPlace: DEFAULT_DATA.thirdPlace,
  }
}

export function computeGroupStandings(matches: Match[]) {
  const groups = new Map<string, Map<string, StandingRow>>()

  const ensure = (group: string, name: string, flag: string) => {
    let standings = groups.get(group)
    if (!standings) {
      standings = new Map()
      groups.set(group, standings)
    }

    let row = standings.get(name)
    if (!row) {
      row = { name, flag, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
      standings.set(name, row)
    }

    return row
  }

  for (const match of matches) {
    if (match.phase !== 'groupes' || !match.group_name) continue

    const home = ensure(match.group_name, match.team_home, match.flag_home)
    const away = ensure(match.group_name, match.team_away, match.flag_away)

    if (match.score_home === null || match.score_away === null) continue

    const homeScore = match.score_home
    const awayScore = match.score_away

    home.played++
    away.played++
    home.gf += homeScore
    home.ga += awayScore
    away.gf += awayScore
    away.ga += homeScore

    if (homeScore > awayScore) {
      home.win++
      home.pts += 3
      away.loss++
    } else if (homeScore < awayScore) {
      away.win++
      away.pts += 3
      home.loss++
    } else {
      home.draw++
      away.draw++
      home.pts++
      away.pts++
    }
  }

  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([group, rows]) => {
      const list = [...rows.values()].map(row => ({ ...row, gd: row.gf - row.ga }))
      list.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name))
      return { group, rows: list }
    })
}

export function buildProvisionalGroupResults(matches: Match[]) {
  const provisional = cloneDefaultBracketData()
  const activeGroups: string[] = []

  for (const { group, rows } of computeGroupStandings(matches)) {
    if (rows.length !== 4 || rows.some(row => row.played === 0)) continue

    const teams = GROUP_TEAMS[group]
    if (!teams) continue

    const topThree = rows.slice(0, 3).map(row => teams.findIndex(team => team.name === row.name))
    if (topThree.some(index => index < 0)) continue

    provisional.groupQualified[group] = [topThree[0], topThree[1], topThree[2]]
    activeGroups.push(group)
  }

  return { provisional, activeGroups }
}