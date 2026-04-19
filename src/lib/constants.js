// ============================================================
// ⚠️  DEADLINE — Change this line to update the initial picks
//     deadline. Format: 'YYYY-MM-DDTHH:MM:SS+02:00'
//     (Paris time, UTC+2 in summer)
// ============================================================
export const PLAYOFF_DEADLINE = new Date('2026-04-22T23:59:59+02:00')

// App branding
export const APP_NAME = 'Clutch'
export const APP_COLOR = '#9170ff'
export const APP_COLOR_HOVER = '#c3a5ff'

// ─── Teams ────────────────────────────────────────────────────────────────────
export const TEAMS = {
  east: [
    { seed: 1, name: 'Detroit Pistons',    abbr: 'DET', color: '#C8102E', emoji: '🔴' },
    { seed: 2, name: 'Boston Celtics',     abbr: 'BOS', color: '#007A33', emoji: '🍀' },
    { seed: 3, name: 'New York Knicks',    abbr: 'NYK', color: '#F58426', emoji: '🗽' },
    { seed: 4, name: 'Cleveland Cavaliers',abbr: 'CLE', color: '#860038', emoji: '⚔️' },
    { seed: 5, name: 'Toronto Raptors',    abbr: 'TOR', color: '#CE1141', emoji: '🦖' },
    { seed: 6, name: 'Atlanta Hawks',      abbr: 'ATL', color: '#C1D32F', emoji: '🦅' },
    { seed: 7, name: 'Philadelphia 76ers', abbr: 'PHI', color: '#006BB6', emoji: '🔔' },
    { seed: 8, name: 'Orlando Magic',      abbr: 'ORL', color: '#0077C0', emoji: '🪄' },
  ],
  west: [
    { seed: 1, name: 'OKC Thunder',        abbr: 'OKC', color: '#007AC1', emoji: '⚡' },
    { seed: 2, name: 'San Antonio Spurs',  abbr: 'SAS', color: '#C4CED4', emoji: '🤠' },
    { seed: 3, name: 'Denver Nuggets',     abbr: 'DEN', color: '#FEC524', emoji: '⛰️' },
    { seed: 4, name: 'LA Lakers',          abbr: 'LAL', color: '#552583', emoji: '👑' },
    { seed: 5, name: 'Houston Rockets',    abbr: 'HOU', color: '#CE1141', emoji: '🚀' },
    { seed: 6, name: 'Minnesota T-Wolves', abbr: 'MIN', color: '#0C2340', emoji: '🐺' },
    { seed: 7, name: 'Portland T. Blazers',abbr: 'POR', color: '#E03A3E', emoji: '🌲' },
    { seed: 8, name: 'Phoenix Suns',       abbr: 'PHX', color: '#E56020', emoji: '☀️' },
  ],
}

export const TEAM_BY_ABBR = {}
Object.values(TEAMS).flat().forEach(t => { TEAM_BY_ABBR[t.abbr] = t })

// ─── Bracket ──────────────────────────────────────────────────────────────────
export const BRACKET = {
  east: {
    r1: [
      { key: 'east_r1_0', homeIdx: 0, awayIdx: 7 }, // DET(1) vs ORL(8)
      { key: 'east_r1_1', homeIdx: 3, awayIdx: 4 }, // CLE(4) vs TOR(5)
      { key: 'east_r1_2', homeIdx: 2, awayIdx: 5 }, // NYK(3) vs ATL(6)
      { key: 'east_r1_3', homeIdx: 1, awayIdx: 6 }, // BOS(2) vs PHI(7)
    ],
    r2: [
      { key: 'east_r2_0', fromKeys: ['east_r1_0', 'east_r1_1'] },
      { key: 'east_r2_1', fromKeys: ['east_r1_2', 'east_r1_3'] },
    ],
    r3: [
      { key: 'east_r3_0', fromKeys: ['east_r2_0', 'east_r2_1'] },
    ],
  },
  west: {
    r1: [
      { key: 'west_r1_0', homeIdx: 0, awayIdx: 7 }, // OKC(1) vs PHX(8)
      { key: 'west_r1_1', homeIdx: 3, awayIdx: 4 }, // LAL(4) vs HOU(5)
      { key: 'west_r1_2', homeIdx: 2, awayIdx: 5 }, // DEN(3) vs MIN(6)
      { key: 'west_r1_3', homeIdx: 1, awayIdx: 6 }, // SAS(2) vs POR(7)
    ],
    r2: [
      { key: 'west_r2_0', fromKeys: ['west_r1_0', 'west_r1_1'] },
      { key: 'west_r2_1', fromKeys: ['west_r1_2', 'west_r1_3'] },
    ],
    r3: [
      { key: 'west_r3_0', fromKeys: ['west_r2_0', 'west_r2_1'] },
    ],
  },
  finals: { key: 'finals_0', fromKeys: ['east_r3_0', 'west_r3_0'] },
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
export const SCORING = {
  initial: { winner: 5, gamesBonus: 10 }, // 5 + 10 = 15 max
  series:  { winner: 3, gamesBonus: 6  }, // 3 + 6  = 9 max
  confFinalist: 10,
  finalist:     20,
  champion:     50,
}

export const ROUND_LABELS = {
  r1:     'Round 1',
  r2:     'Semifinals',
  r3:     'Conf. Finals',
  finals: 'NBA Finals',
}
