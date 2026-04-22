import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { buildSeriesMap } from "../lib/nbaApi";
import { calcTotalPts } from "../lib/scoring";
import { BRACKET } from "../lib/constants";

// All series keys across all rounds
const ALL_SERIES_KEYS = [
  ...BRACKET.east.r1.map((s) => s.key),
  ...BRACKET.west.r1.map((s) => s.key),
  ...BRACKET.east.r2.map((s) => s.key),
  ...BRACKET.west.r2.map((s) => s.key),
  ...BRACKET.east.r3.map((s) => s.key),
  ...BRACKET.west.r3.map((s) => s.key),
  BRACKET.finals.key,
];

export default function Rankings({ group, profile }) {
  const [tab, setTab] = useState("group");
  const [loading, setLoading] = useState(true);
  const [groupRows, setGroupRows] = useState([]);
  const [playersRows, setPlayersRows] = useState([]);
  const [teamsRows, setTeamsRows] = useState([]);
  const [totalPickable, setTotalPickable] = useState(0);

  const load = useCallback(async () => {
    try {
      const { seriesMap: sm } = await buildSeriesMap();

      // Count series where both teams are known = pickable
      const pickableKeys = ALL_SERIES_KEYS.filter((key) => {
        const s = sm[key];
        return s?.teamA && s?.teamB;
      });
      setTotalPickable(ALL_SERIES_KEYS.length);
      // All predictions
      const { data: allPreds } = await supabase.from("predictions").select("*");

      // Helper: count unique series picked by a user
      function countPicks(preds) {
        const uniqueSeries = new Set(preds.map((p) => p.series_key));
        return uniqueSeries.size;
      }

      // ── Your Team ─────────────────────────────────────────────
      const { data: members } = await supabase
        .from("group_members")
        .select("user_id, profiles(display_name)")
        .eq("group_id", group.id);

      const uniqueMembers = [
        ...new Map((members || []).map((m) => [m.user_id, m])).values(),
      ];

      const gRows = uniqueMembers
        .map((m) => {
          const preds = allPreds?.filter((p) => p.user_id === m.user_id) || [];
          const { total } = calcTotalPts(preds, sm);
          const correct = preds.filter(
            (p) => sm[p.series_key]?.winner === p.predicted_winner,
          ).length;
          const picks = countPicks(preds);
          return {
            uid: m.user_id,
            name: m.profiles?.display_name || "Unknown",
            total,
            correct,
            picks,
            isMe: m.user_id === profile.id,
          };
        })
        .sort((a, b) => b.total - a.total);
      setGroupRows(gRows);

      // ── All Players Rankings ───────────────────────────────────
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, display_name");

      const pRows = (allProfiles || [])
        .map((m) => {
          const preds = allPreds?.filter((p) => p.user_id === m.id) || [];
          const { total } = calcTotalPts(preds, sm);
          const correct = preds.filter(
            (p) => sm[p.series_key]?.winner === p.predicted_winner,
          ).length;
          const picks = countPicks(preds);
          return {
            uid: m.id,
            name: m.display_name || "Unknown",
            total,
            correct,
            picks,
            isMe: m.id === profile.id,
          };
        })
        .sort((a, b) => b.total - a.total);
      setPlayersRows(pRows);

      // ── Team Rankings ─────────────────────────────────────────
      const { data: allGroups } = await supabase
        .from("groups")
        .select("id, name")
        .neq("name", "Clutch League");
      const { data: allGroupMembers } = await supabase
        .from("group_members")
        .select("group_id, user_id, profiles(display_name)");

      const tRows = (allGroups || [])
        .map((g) => {
          const gMembers = [
            ...new Map(
              (allGroupMembers?.filter((m) => m.group_id === g.id) || []).map(
                (m) => [m.user_id, m],
              ),
            ).values(),
          ];

          const activePlayers = gMembers.filter((m) =>
            allPreds?.some((p) => p.user_id === m.user_id),
          );

          if (activePlayers.length === 0)
            return {
              id: g.id,
              name: g.name,
              playerCount: gMembers.length,
              avgScore: 0,
              activePlayers: 0,
            };

          const scores = activePlayers.map((m) => {
            const preds =
              allPreds?.filter((p) => p.user_id === m.user_id) || [];
            const { total } = calcTotalPts(preds, sm);
            return total;
          });
          const avgScore = Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length,
          );
          return {
            id: g.id,
            name: g.name,
            playerCount: gMembers.length,
            activePlayers: activePlayers.length,
            avgScore,
          };
        })
        .sort((a, b) => b.avgScore - a.avgScore);

      setTeamsRows(tRows);
    } finally {
      setLoading(false);
    }
  }, [group.id, profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const medals = ["🥇", "🥈", "🥉"];

  if (loading)
    return (
      <div className="page text-center" style={{ paddingTop: 60 }}>
        📊 Calculating scores…
      </div>
    );

  return (
    <div className="page fade-up">
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "var(--bg2)",
          borderRadius: "var(--r)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        {[
          ["group", "Your Team"],
          ["players", "All Players"],
          ["teams", "Team Rankings"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              flex: 1,
              padding: "10px 4px",
              background: tab === k ? "var(--purple-bg)" : "transparent",
              border: "none",
              borderBottom:
                tab === k ? "2px solid var(--purple)" : "2px solid transparent",
              color: tab === k ? "var(--purple)" : "var(--text3)",
              fontFamily: "Barlow Condensed",
              fontSize: 11,
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

      {tab === "group" && (
        <>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ color: "var(--text3)", fontSize: 12 }}>{group.name}</p>
          </div>
          <RankingList
            rows={groupRows}
            medals={medals}
            totalPickable={totalPickable}
          />
          <div style={{ marginTop: 24 }}>
            <InviteShare group={group} />
          </div>
        </>
      )}

      {tab === "players" && (
        <>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ color: "var(--text3)", fontSize: 12 }}>
              All players across all groups
            </p>
          </div>
          <RankingList
            rows={playersRows}
            medals={medals}
            totalPickable={totalPickable}
          />
        </>
      )}

      {tab === "teams" && (
        <>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ color: "var(--text3)", fontSize: 12 }}>
              Groups ranked by average score
            </p>
            <p style={{ color: "var(--text3)", fontSize: 11, marginTop: 4 }}>
              Only players with at least 1 pick are included in the average
            </p>
          </div>
          {teamsRows.length === 0 ? (
            <div
              className="card text-center"
              style={{ padding: 32, color: "var(--text3)" }}
            >
              No groups yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teamsRows.map((row, i) => (
                <div
                  key={row.id}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background:
                      row.id === group.id
                        ? "rgba(145,112,255,0.06)"
                        : "var(--bg2)",
                    borderColor:
                      row.id === group.id
                        ? "rgba(145,112,255,0.3)"
                        : "var(--border)",
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Barlow Condensed",
                      fontWeight: 900,
                      fontSize: i < 3 ? 22 : 16,
                      color: i < 3 ? "var(--purple)" : "var(--text3)",
                      flexShrink: 0,
                    }}
                  >
                    {i < 3 ? medals[i] : `#${i + 1}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "Barlow Condensed",
                        fontWeight: 700,
                        fontSize: 17,
                        color:
                          row.id === group.id ? "var(--purple)" : "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.name}
                      {row.id === group.id && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text3)",
                            fontWeight: 400,
                          }}
                        >
                          {" "}
                          (yours)
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text3)",
                        marginTop: 2,
                      }}
                    >
                      {row.playerCount} members · {row.activePlayers} with picks
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      className="condensed"
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color:
                          i === 0 || row.id === group.id
                            ? "var(--purple)"
                            : "var(--text)",
                      }}
                    >
                      {row.avgScore}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text3)",
                        letterSpacing: 1,
                        fontFamily: "Barlow Condensed",
                      }}
                    >
                      AVG PTS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RankingList({ rows, medals, totalPickable }) {
  if (rows.length === 0)
    return (
      <div
        className="card text-center"
        style={{ padding: 32, color: "var(--text3)" }}
      >
        No participants yet.
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((row, i) => (
        <div
          key={row.uid}
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: row.isMe ? "rgba(145,112,255,0.06)" : "var(--bg2)",
            borderColor: row.isMe ? "rgba(145,112,255,0.3)" : "var(--border)",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Barlow Condensed",
              fontWeight: 900,
              fontSize: i < 3 ? 22 : 16,
              color: i < 3 ? "var(--purple)" : "var(--text3)",
              flexShrink: 0,
            }}
          >
            {i < 3 ? medals[i] : `#${i + 1}`}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "Barlow Condensed",
                fontWeight: 700,
                fontSize: 17,
                color: row.isMe ? "var(--purple)" : "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.name}
              {row.isMe && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text3)",
                    fontWeight: 400,
                  }}
                >
                  {" "}
                  (me)
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
              {row.correct} correct series
            </div>
            <div
              style={{
                fontSize: 11,
                marginTop: 2,
                color:
                  row.picks >= totalPickable ? "var(--green)" : "var(--text3)",
              }}
            >
              {row.picks} / {totalPickable} picks completed
              {row.picks >= totalPickable && " ✓"}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              className="condensed"
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: i === 0 || row.isMe ? "var(--purple)" : "var(--text)",
              }}
            >
              {row.total}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text3)",
                letterSpacing: 1,
                fontFamily: "Barlow Condensed",
              }}
            >
              PTS
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InviteShare({ group }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const link = `${window.location.origin}/join/${group.invite_code}`;
    await navigator.clipboard.writeText(
      `🏀 Join my Clutch group "${group.name}"!\n${link}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
        Invite more people to this group
      </p>
      <button className="btn btn-ghost btn-full" onClick={copy}>
        {copied ? "✅ Link copied!" : "📲 Copy invite link"}
      </button>
      <p
        style={{
          fontSize: 11,
          color: "var(--text3)",
          marginTop: 8,
          letterSpacing: 1,
        }}
      >
        Code:{" "}
        <strong style={{ color: "var(--purple)" }}>{group.invite_code}</strong>
      </p>
    </div>
  );
}
