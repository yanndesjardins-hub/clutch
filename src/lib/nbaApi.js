import { BRACKET, TEAMS, TEAM_BY_ABBR } from "./constants";
import { supabase } from "./supabase";

// In-memory cache (2 minutes) — reduces Supabase reads for a given user session
let _cache = null;
let _cacheAt = 0;
const TTL = 2 * 60 * 1000;

// ─── Fetch all 2025-26 playoff games from Supabase cache ─────────────────────
export async function fetchAllPlayoffGames() {
  if (_cache && Date.now() - _cacheAt < TTL) return _cache;

  const { data, error } = await supabase
    .from("games_cache")
    .select("games, updated_at")
    .eq("id", "playoffs_2025")
    .single();

  if (error) throw new Error(`Supabase cache: ${error.message}`);
  if (!data?.games) throw new Error("No games in cache yet");

  _cache = data.games;
  _cacheAt = Date.now();
  return _cache;
}

// ─── Compute series score from raw games ─────────────────────────────────────
function computeSeriesFromGames(games, abbrA, abbrB) {
  const sg = games.filter((g) => {
    const abbrs = [g.home_team.abbreviation, g.visitor_team.abbreviation];
    return abbrs.includes(abbrA) && abbrs.includes(abbrB);
  });

  if (!sg.length)
    return {
      status: "upcoming",
      winsA: 0,
      winsB: 0,
      gamesPlayed: 0,
      winner: null,
      actualGames: null,
    };

  let winsA = 0,
    winsB = 0;
  sg.forEach((g) => {
    const hs = g.home_team_score,
      vs = g.visitor_team_score;
    if (!hs || !vs) return;
    const homeWon = hs > vs;
    const aIsHome = g.home_team.abbreviation === abbrA;
    if (homeWon) aIsHome ? winsA++ : winsB++;
    else aIsHome ? winsB++ : winsA++;
  });

  const done = winsA === 4 || winsB === 4;
  return {
    status: done ? "finished" : "active",
    winsA,
    winsB,
    gamesPlayed: sg.length,
    winner: done ? (winsA === 4 ? abbrA : abbrB) : null,
    actualGames: done ? sg.length : null,
  };
}

// ─── Build the full series map ───────────────────────────────────────────────
export async function buildSeriesMap() {
  const games = await fetchAllPlayoffGames();

  const realWinners = {};
  const result = {};

  function processRound(slots, conf) {
    slots.forEach((slot) => {
      let abbrA, abbrB;

      if (slot.homeIdx !== undefined) {
        abbrA = TEAMS[conf][slot.homeIdx].abbr;
        abbrB = TEAMS[conf][slot.awayIdx].abbr;
      } else {
        abbrA = realWinners[slot.fromKeys[0]] || null;
        abbrB = realWinners[slot.fromKeys[1]] || null;
      }

      const teamA = abbrA ? TEAM_BY_ABBR[abbrA] : null;
      const teamB = abbrB ? TEAM_BY_ABBR[abbrB] : null;

      const seriesData =
        abbrA && abbrB
          ? computeSeriesFromGames(games, abbrA, abbrB)
          : {
              status: "upcoming",
              winsA: 0,
              winsB: 0,
              gamesPlayed: 0,
              winner: null,
              actualGames: null,
            };

      if (seriesData.winner) realWinners[slot.key] = seriesData.winner;
      result[slot.key] = { ...seriesData, teamA, teamB, key: slot.key };
    });
  }

  processRound(BRACKET.east.r1, "east");
  processRound(BRACKET.east.r2, "east");
  processRound(BRACKET.east.r3, "east");
  processRound(BRACKET.west.r1, "west");
  processRound(BRACKET.west.r2, "west");
  processRound(BRACKET.west.r3, "west");

  const fSlot = BRACKET.finals;
  const fA = realWinners[fSlot.fromKeys[0]] || null;
  const fB = realWinners[fSlot.fromKeys[1]] || null;
  const fData =
    fA && fB
      ? computeSeriesFromGames(games, fA, fB)
      : {
          status: "upcoming",
          winsA: 0,
          winsB: 0,
          gamesPlayed: 0,
          winner: null,
          actualGames: null,
        };
  if (fData.winner) realWinners[fSlot.key] = fData.winner;
  result[fSlot.key] = {
    ...fData,
    teamA: fA ? TEAM_BY_ABBR[fA] : null,
    teamB: fB ? TEAM_BY_ABBR[fB] : null,
    key: fSlot.key,
  };

  return { seriesMap: result, realWinners };
}
