import { useState, useEffect, useCallback } from "react";
import {
  BRACKET,
  TEAMS,
  TEAM_BY_ABBR,
  PLAYOFF_DEADLINE,
} from "../lib/constants";
import { buildSeriesMap } from "../lib/nbaApi";
import { supabase } from "../lib/supabase";
import BracketSlot from "../components/BracketSlot";
import PredictionModal from "../components/PredictionModal";
import Countdown from "../components/Countdown";


export default function PlayoffView({ group, profile }) {
  const [seriesMap, setSeriesMap] = useState({});
  const [predictions, setPredictions] = useState({});
  const [modal, setModal] = useState(null);
  const [conf, setConf] = useState("east");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!profile?.id || !group?.id) return; // modified avec florian
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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [group?.id, profile?.id]); // modified avec florian

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  async function savePrediction({
    seriesKey,
    type,
    predicted_winner,
    predicted_games,
  }) {
    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: profile.id,
        series_key: seriesKey,
        type,
        predicted_winner,
        predicted_games,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,series_key,type" },
    );
    if (error) throw error;
    await load();
    setModal(null);
  }

  function isEditable(series) {
    if (!series) return false;
    if (new Date() > PLAYOFF_DEADLINE) return false;
    if (series.status === "finished") return false;
    return true;
  }

  // Bracket always shows the INITIAL pick so players keep a visual trace of
  // their starting bracket, even after submitting per-series picks later.
  function getUserPick(key) {
    return predictions[key]?.initial?.predicted_winner || null;
  }

  function getUserGames(key) {
    return predictions[key]?.initial?.predicted_games || null;
  }

  function getCurrentPick(key) {
    const p = predictions[key];
    return p?.initial || null;
  }

  function resolveTeam(key) {
    if (seriesMap[key]?.winner) return TEAM_BY_ABBR[seriesMap[key].winner];
    const pick = getUserPick(key);
    return pick ? TEAM_BY_ABBR[pick] : null;
  }

  function getSlots(c) {
    const b = BRACKET[c];
    const r1 = b.r1.map((slot) => ({
      ...slot,
      series: seriesMap[slot.key] || {
        teamA: TEAMS[c][slot.homeIdx],
        teamB: TEAMS[c][slot.awayIdx],
        status: "upcoming",
        winsA: 0,
        winsB: 0,
      },
    }));
    const r2 = b.r2.map((slot) => {
      const real = seriesMap[slot.key];
      if (real?.teamA && real?.teamB) return { ...slot, series: real };
      return {
        ...slot,
        series: {
          teamA: resolveTeam(slot.fromKeys[0]),
          teamB: resolveTeam(slot.fromKeys[1]),
          status: "upcoming",
          winsA: 0,
          winsB: 0,
        },
      };
    });
    const r3 = b.r3.map((slot) => {
      const real = seriesMap[slot.key];
      if (real?.teamA && real?.teamB) return { ...slot, series: real };
      return {
        ...slot,
        series: {
          teamA: resolveTeam(slot.fromKeys[0]),
          teamB: resolveTeam(slot.fromKeys[1]),
          status: "upcoming",
          winsA: 0,
          winsB: 0,
        },
      };
    });
    return { r1, r2, r3 };
  }

  function getFinalsSeries() {
    const real = seriesMap["finals_0"];
    if (real?.teamA && real?.teamB) return real;
    return {
      teamA: resolveTeam("east_r3_0"),
      teamB: resolveTeam("west_r3_0"),
      status: "upcoming",
      winsA: 0,
      winsB: 0,
    };
  }

  if (loading)
    return (
      <div className="page text-center" style={{ paddingTop: 60 }}>
        <img
          src="/clutch_logo_ball.png"
          alt=""
          style={{
            width: 48,
            height: 48,
            display: "block",
            margin: "0 auto 12px",
            animation: "loader-pulse 1.4s ease-in-out infinite",
          }}
        />
        Loading bracket…
      </div>
    );
  if (error)
    return (
      <div
        className="page text-center"
        style={{ paddingTop: 60, color: "var(--red)" }}
      >
        ❌ {error}
      </div>
    );

  const slots = getSlots(conf);
  const finalsSeries = getFinalsSeries();

  return (
    <div className="page fade-up">
      <Countdown />

      {/* Conf tabs */}
      <div
        style={{
          display: "flex",
          background: "var(--bg2)",
          borderRadius: "var(--r)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {[
          ["east", "East"],
          ["west", "West"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setConf(k)}
            style={{
              flex: 1,
              padding: "11px 8px",
              background: conf === k ? "var(--purple-bg)" : "transparent",
              border: "none",
              borderBottom:
                conf === k
                  ? "2px solid var(--purple)"
                  : "2px solid transparent",
              color: conf === k ? "var(--purple)" : "var(--text3)",
              fontFamily: "Barlow Condensed",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bracket horizontal scroll */}
      <div
        style={{ overflowX: "auto", paddingBottom: 12 }}
        className="bracket-scroll"
      >
        <div
          style={{
            display: "flex",
            minWidth: "max-content",
            alignItems: "stretch",
          }}
        >
          <RoundCol
            title="Round 1"
            slots={slots.r1}
            getUserPick={getUserPick}
            getUserGames={getUserGames}
            getCurrentPick={getCurrentPick}
            isEditable={isEditable}
            setModal={setModal}
          />

          <Connector pairs={2} />

          <RoundCol
            title="Semifinals"
            slots={slots.r2}
            getUserPick={getUserPick}
            getUserGames={getUserGames}
            getCurrentPick={getCurrentPick}
            isEditable={isEditable}
            setModal={setModal}
          />

          <Connector pairs={1} />

          <RoundCol
            title="Conf. Finals"
            slots={slots.r3}
            getUserPick={getUserPick}
            getUserGames={getUserGames}
            getCurrentPick={getCurrentPick}
            isEditable={isEditable}
            setModal={setModal}
          />

          <Connector straight />

          <RoundCol
            title="NBA Finals"
            slots={[{ key: "finals_0", series: finalsSeries }]}
            getUserPick={getUserPick}
            getUserGames={getUserGames}
            getCurrentPick={getCurrentPick}
            isEditable={isEditable}
            setModal={setModal}
          />
        </div>
      </div>

      {modal && (
        <PredictionModal
          series={modal.series}
          currentPick={getCurrentPick(modal.seriesKey)}
          onSave={(pick) =>
            savePrediction({
              seriesKey: modal.seriesKey,
              type: "initial",
              ...pick,
            })
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

const ROUND_HEADER_STYLE = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: "var(--text3)",
  textAlign: "center",
  paddingBottom: 6,
  borderBottom: "1px solid var(--text3)",
  marginBottom: 2,
};

function RoundCol({
  title,
  slots,
  getUserPick,
  getUserGames,
  isEditable,
  setModal,
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", width: 168 }}
    >
      <div className="condensed" style={ROUND_HEADER_STYLE}>
        {title}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {slots.map(({ key, series }) => (
          <div
            key={key}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              padding: "4px 0",
            }}
          >
            <BracketSlot
              series={series || { teamA: null, teamB: null, status: "upcoming" }}
              userPick={getUserPick(key)}
              userGames={getUserGames(key)}
              isEditable={isEditable(series || {})}
              onClick={() =>
                series &&
                isEditable(series) &&
                setModal({ seriesKey: key, series })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Connector({ pairs, straight }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 24,
        alignSelf: "stretch",
      }}
    >
      {/* Invisible header spacer so the connector area starts level with slot area */}
      <div
        className="condensed"
        style={{ ...ROUND_HEADER_STYLE, visibility: "hidden" }}
        aria-hidden="true"
      >
        &nbsp;
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {straight ? (
          <StraightConnector />
        ) : (
          Array.from({ length: pairs }).map((_, i) => (
            <BracketPairConnector key={i} />
          ))
        )}
      </div>
    </div>
  );
}

function BracketPairConnector() {
  const line = "var(--border)";
  return (
    <div style={{ flex: 1, position: "relative" }}>
      {/* Top feeder horizontal (from R1[i] center to vertical) */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: 0,
          width: "50%",
          height: 1,
          background: line,
        }}
      />
      {/* Bottom feeder horizontal */}
      <div
        style={{
          position: "absolute",
          top: "75%",
          left: 0,
          width: "50%",
          height: 1,
          background: line,
        }}
      />
      {/* Vertical line joining the two feeders */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          bottom: "25%",
          left: "calc(50% - 1px)",
          width: 1,
          background: line,
        }}
      />
      {/* Output horizontal to next round's box center */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% - 1px)",
          left: "50%",
          right: 0,
          height: 1,
          background: line,
        }}
      />
    </div>
  );
}

function StraightConnector() {
  return (
    <div style={{ flex: 1, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: "calc(50% - 1px)",
          left: 0,
          right: 0,
          height: 1,
          background: "var(--border)",
        }}
      />
    </div>
  );
}
