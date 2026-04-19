import { BRACKET, TEAMS, TEAM_BY_ABBR } from './constants'

const BASE = 'https://api.balldontlie.io/v1'
const KEY  = import.meta.env.VITE_BALLDONTLIE_KEY

// In-memory cache (5 minutes)
let _cache = null
let _cacheAt = 0
const TTL = 5 * 60 * 1000

// ─── Fetch all 2025-26 playoff games ─────────────────────────────────────────
export async function fetchAllPlayoffGames() {
  if (_cache && Date.now() - _cacheAt < TTL) return _cache

  const all = []
  let cursor = null

  while (true) {
    const params = new URLSearchParams({ 'seasons[]': '2025', postseason: 'true', per_page: '100' })
    if (cursor) params.set('cursor', String(cursor))

    const res = await fetch(`${BASE}/games?${params}`, { headers: { Authorization: KEY } })
    if (!res.ok) throw new Error(`BallDontLie ${res.status}`)

    const { data, meta } = await res.json()
    all.push(...data)
    if (!meta?.next_cursor) break
    cursor = meta.next_cursor
  }

  _cache   = all
  _cacheAt = Date.now()
  return all
}

// ─── Compute series score from raw games ─────────────────────────────────────
// Returns: { status, winsA, winsB, gamesPlayed, winner, actualGames }
function computeSeriesFromGames(games, abbrA, abbrB) {
  const sg = games.filter(g => {
    const abbrs = [g.home_team.abbreviation, g.visitor_team.abbreviation]
    return abbrs.includes(abbrA) && abbrs.includes(abbrB)
  })

  if (!sg.length) return { status: 'upcoming', winsA: 0, winsB: 0, gamesPlayed: 0, winner: null, actualGames: null }

  let winsA = 0, winsB = 0
  sg.forEach(g => {
    const hs = g.home_team_score, vs = g.visitor_team_score
    if (!hs || !vs) return
    const homeWon  = hs > vs
    const aIsHome  = g.home_team.abbreviation === abbrA
    if (homeWon) aIsHome ? winsA++ : winsB++
    else         aIsHome ? winsB++ : winsA++
  })

  const done = winsA === 4 || winsB === 4
  return {
    status:      done ? 'finished' : 'active',
    winsA, winsB,
    gamesPlayed: sg.length,
    winner:      done ? (winsA === 4 ? abbrA : abbrB) : null,
    actualGames: done ? sg.length : null,
  }
}

// ─── Build the full series map from the API ───────────────────────────────────
// Returns: { seriesMap: { [series_key]: { status, teamA, teamB, winsA, winsB, winner, actualGames } }, realWinners }
export async function buildSeriesMap() {
  const games = await fetchAllPlayoffGames()

  const realWinners = {} // series_key → actual winner abbr
  const result = {}

  function processRound(slots, conf) {
    slots.forEach(slot => {
      let abbrA, abbrB

      if (slot.homeIdx !== undefined) {
        // Round 1: fixed teams
        abbrA = TEAMS[conf][slot.homeIdx].abbr
        abbrB = TEAMS[conf][slot.awayIdx].abbr
      } else {
        // Later rounds: winners from previous series
        abbrA = realWinners[slot.fromKeys[0]] || null
        abbrB = realWinners[slot.fromKeys[1]] || null
      }

      const teamA = abbrA ? TEAM_BY_ABBR[abbrA] : null
      const teamB = abbrB ? TEAM_BY_ABBR[abbrB] : null

      const seriesData = abbrA && abbrB
        ? computeSeriesFromGames(games, abbrA, abbrB)
        : { status: 'upcoming', winsA: 0, winsB: 0, gamesPlayed: 0, winner: null, actualGames: null }

      if (seriesData.winner) realWinners[slot.key] = seriesData.winner
      result[slot.key] = { ...seriesData, teamA, teamB, key: slot.key }
    })
  }

  // East
  processRound(BRACKET.east.r1, 'east')
  processRound(BRACKET.east.r2, 'east')
  processRound(BRACKET.east.r3, 'east')
  // West
  processRound(BRACKET.west.r1, 'west')
  processRound(BRACKET.west.r2, 'west')
  processRound(BRACKET.west.r3, 'west')
  // Finals
  const fSlot = BRACKET.finals
  const fA = realWinners[fSlot.fromKeys[0]] || null
  const fB = realWinners[fSlot.fromKeys[1]] || null
  const fData = fA && fB
    ? computeSeriesFromGames(games, fA, fB)
    : { status: 'upcoming', winsA: 0, winsB: 0, gamesPlayed: 0, winner: null, actualGames: null }
  if (fData.winner) realWinners[fSlot.key] = fData.winner
  result[fSlot.key] = { ...fData, teamA: fA ? TEAM_BY_ABBR[fA] : null, teamB: fB ? TEAM_BY_ABBR[fB] : null, key: fSlot.key }

  return { seriesMap: result, realWinners }
}
