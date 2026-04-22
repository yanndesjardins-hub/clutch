import { useState, useEffect, useCallback } from "react";
import { BRACKET, TEAMS, TEAM_BY_ABBR } from "../lib/constants";
import { buildSeriesMap } from "../lib/nbaApi";
import { supabase } from "../lib/supabase";
import PredictionModal from "../components/PredictionModal";

// All series keys in display order, grouped by round
const ROUNDS = [
  {
    label: "Round 1",
    keys: [
      ...BRACKET.east.r1.map((s) => ({ key: s.key, conf: "east" })),
      ...BRACKET.west.r1.map((s) => ({ key: s.key, conf: "west" })),
    ],
    round: "r1",
  },
  {
    label: "Semifinals",
    keys: [
      ...BRACKET.east.r2.map((s) => ({ key: s.key, conf: "east" })),
      ...BRACKET.west.r2.map((s) => ({ key: s.key, conf: "west" })),
    ],
    round: "r2",
  },
  {
    label: "Conf. Finals",
    keys: [
      ...BRACKET.east.r3.map((s) => ({ key: s.key, conf: "east" })),
      ...BRACKET.west.r3.map((s) => ({ key: s.key, conf: "west" })),
    ],
    round: "r3",
  },
  {
    label: "NBA Finals",
    keys: [{ key: BRACKET.finals.key, conf: "finals" }],
    round: "finals",
  },
];

// Build R1 series from constants (always known)
function buildR1Series(key) {
  for (const conf of ["east", "west"]) {
    const slot = BRACKET[conf].r1.find((s) => s.key === key);
    if (slot) {
      return {
        key,
        teamA: TEAMS[conf][slot.homeIdx],
        teamB: TEAMS[conf][slot.awayIdx],
        status: "upcoming",
        winsA: 0,
        winsB: 0,
        winner: null,
        actualGames: null,
      };
    }
  }
  return null;
}

export default function SeriesView({ group, profile }) {
  const [seriesMap, setSeriesMap] = useState({});
  const [predictions, setPredictions] = useState({});
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { seriesMap: sm } = await buildSeriesMap();
      setSeriesMap(sm);
      const { data } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", profile.id);
      const pMap = {};
      data?.forEach((p) => {
        if (!pMap[p.series_key]) pMap[p.series_key] = {};
        pMap[p.series_key][p.type] = p;
      });
      setPredictions(pMap);
    } finally {
      setLoading(false);
    }
  }, [group.id, profile.id]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  async function savePrediction({
    seriesKey,
    predicted_winner,
    predicted_games,
  }) {
    await supabase.from("predictions").upsert(
      {
        user_id: profile.id,
        series_key: seriesKey,
        type: "series",
        predicted_winner,
        predicted_games,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,group_id,series_key,type" },
    );
    await load();
    setModal(null);
  }

  // Best pick for a series (series pick > initial pick)
  function getBestPick(key) {
    const p = predictions[key];
    return p?.series || p?.initial || null;
  }

  // Get series data — for R1, always show from constants
  function getSeries(key, round) {
    const fromApi = seriesMap[key];
    if (round === "r1") {
      return fromApi || buildR1Series(key);
    }
    // R2+ : show from API if exists, else TBD
    return (
      fromApi || {
        key,
        teamA: null,
        teamB: null,
        status: "upcoming",
        winsA: 0,
        winsB: 0,
        winner: null,
      }
    );
  }

  // Can user submit a series pick?
  // Only for R2+ series that are upcoming (not started yet) and both teams known
  function canPick(series, round) {
    if (round === "r1") return false;
    if (!series.teamA || !series.teamB) return false;
    return series.status === "upcoming";
  }

  if (loading)
    return (
      <div className="page text-center" style={{ paddingTop: 60 }}>
        🏀 Loading series…
      </div>
    );

  return (
    <div className="page fade-up">
      {ROUNDS.map(({ label, keys, round }) => {
        const seriesList = keys.map(({ key }) => ({
          key,
          series: getSeries(key, round),
        }));

        return (
          <div key={round} style={{ marginBottom: 28 }}>
            {/* Round header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid rgba(245,184,65,0.2)",
              }}
            >
              <span
                className="condensed"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "var(--purple)",
                }}
              >
                {label}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {seriesList.map(({ key, series }) => {
                const pick = getBestPick(key);
                const pickable = canPick(series, round);
                const correct =
                  series.status === "finished" &&
                  pick?.predicted_winner === series.winner;
                const wrong =
                  series.status === "finished" &&
                  pick?.predicted_winner &&
                  pick.predicted_winner !== series.winner;

                return (
                  <SeriesCard
                    key={key}
                    series={series}
                    pick={pick}
                    pickable={pickable}
                    correct={correct}
                    wrong={wrong}
                    onPickClick={() => setModal({ seriesKey: key, series })}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Floating modal */}
      {modal && (
        <PredictionModal
          series={modal.series}
          currentPick={getBestPick(modal.seriesKey)}
          onSave={(pick) =>
            savePrediction({ seriesKey: modal.seriesKey, ...pick })
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Series Card ───────────────────────────────────────────────────────────────
function SeriesCard({ series, pick, pickable, correct, wrong, onPickClick }) {
  const { teamA, teamB, status, winsA, winsB, winner } = series;
  const isTBD = !teamA || !teamB;

  const statusColor =
    status === "active"
      ? "#ff6b6b"
      : status === "finished"
        ? "var(--green)"
        : "var(--text3)";
  const statusLabel =
    status === "active"
      ? "🔴NOW"
      : status === "finished"
        ? "✅ Done"
        : "⏳ Upcoming";

  return (
    <div
      className="card"
      style={{
        borderColor:
          status === "active" ? "rgba(245,184,65,0.25)" : "var(--border)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: "Barlow Condensed",
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: statusColor,
          }}
        >
          {statusLabel}
        </span>
        {pickable && (
          <button className="btn btn-ghost btn-sm" onClick={onPickClick}>
            {pick ? "✏️ Edit pick" : "+ Add pick"}
          </button>
        )}
      </div>

      {/* Teams + score */}
      {isTBD ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
          }}
        >
          <TBDPill />
          <span style={{ color: "var(--text3)", fontSize: 12 }}>VS</span>
          <TBDPill right />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TeamPill
            team={teamA}
            isWinner={winner === teamA.abbr}
            isPicked={pick?.predicted_winner === teamA.abbr}
          />
          <div style={{ textAlign: "center", padding: "0 8px", minWidth: 60 }}>
            {status !== "upcoming" ? (
              <span
                className="condensed"
                style={{ fontSize: 24, fontWeight: 900, color: "var(--text2)" }}
              >
                {winsA} – {winsB}
              </span>
            ) : (
              <span style={{ color: "var(--text3)", fontSize: 12 }}>VS</span>
            )}
          </div>
          <TeamPill
            team={teamB}
            isWinner={winner === teamB.abbr}
            isPicked={pick?.predicted_winner === teamB.abbr}
            right
          />
        </div>
      )}

      {/* My pick */}
      {pick && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
          }}
        >
          <span style={{ color: "var(--text3)" }}>MY PICK:</span>
          <span
            style={{
              fontFamily: "inter",
              fontWeight: 700,
              color: correct
                ? "var(--green)"
                : wrong
                  ? "var(--red)"
                  : "var(--text3)",
            }}
          >
            {TEAM_BY_ABBR[pick.predicted_winner]?.abbr || pick.predicted_winner}{" "}
            in {pick.predicted_games}
            {correct ? " ✓" : wrong ? " ✗" : ""}
          </span>
        </div>
      )}

      {/* No pick yet on pickable series */}
      {!pick && pickable && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--purple)",
          }}
        >
          👆 👆 No pick yet
        </div>
      )}
    </div>
  );
}

function TeamPill({ team, isWinner, isPicked, right }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: right ? "row-reverse" : "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 22 }}>{team.emoji}</span>
      <div style={{ textAlign: right ? "right" : "left" }}>
        <div
          className="condensed"
          style={{
            fontWeight: 800,
            fontSize: 15,
            textTransform: "uppercase",
            color: isWinner
              ? "var(--green)"
              : isPicked
                ? "#fff"
                : "var(--text2)",
          }}
        >
          {team.abbr}
        </div>
        <div style={{ fontSize: 10, color: "var(--text3)" }}>#{team.seed}</div>
      </div>
    </div>
  );
}

function TBDPill({ right }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: right ? "row-reverse" : "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 22 }}>❓</span>
      <div style={{ textAlign: right ? "right" : "left" }}>
        <div
          className="condensed"
          style={{ fontWeight: 800, fontSize: 15, color: "var(--text3)" }}
        >
          TBD
        </div>
        <div style={{ fontSize: 10, color: "var(--text3)" }}>
          To be determined
        </div>
      </div>
    </div>
  );
}
