import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { buildSeriesMap } from "../lib/nbaApi";

function TrophyIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function CalendarIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function BarChartIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}

function BookIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function UserIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function StarIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const TABS = [
  { path: "/group/bracket", Icon: TrophyIcon, label: "Bracket" },
  { path: "/group/series", Icon: CalendarIcon, label: "Series" },
  { path: "/group/specials", Icon: StarIcon, label: "Specials" },
  { path: "/group/rankings", Icon: BarChartIcon, label: "Rankings" },
  { path: "/group/rules", Icon: BookIcon, label: "Rules" },
  { path: "/group/account", Icon: UserIcon, label: "Account" },
];

const PURPLE = "#9170ff";
const GRAY = "#aaaaaa";

export default function Navbar({ group, onLeave, profile }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const badges = useNavBadges(profile?.id, pathname);

  return (
    <>
      {/* Top bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(10,10,10,0.97)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 48,
        }}
      >
        <img
          src="/clutch_logo.png"
          alt="Clutch"
          onClick={onLeave}
          style={{ height: 44, cursor: "pointer", transition: "opacity 0.2s" }}
          onMouseEnter={(e) => (e.target.style.opacity = "0.75")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        />
        <span
          style={{
            fontSize: 12,
            color: "var(--text3)",
            fontFamily: "Barlow Condensed",
            letterSpacing: 1,
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {group?.name}
        </span>
      </div>

      {/* Bottom nav */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(10,10,10,0.97)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          height: "var(--nav-h)",
        }}
      >
        {TABS.map(({ path, Icon, label }) => {
          const active = pathname === path;
          const color = active ? PURPLE : GRAY;
          const showBadge =
            (path === "/group/series" && badges.series) ||
            (path === "/group/specials" && badges.specials);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                background: "none",
                border: "none",
                borderTop: active
                  ? `2px solid ${PURPLE}`
                  : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                padding: "6px 0",
              }}
            >
              <span style={{ position: "relative", display: "inline-flex" }}>
                <Icon color={color} />
                {showBadge && (
                  <span
                    style={{
                      position: "absolute",
                      top: -1,
                      right: -1,
                      width: 5,
                      height: 5,
                      background: "#ff3b30",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </span>
              <span
                style={{
                  fontFamily: "Barlow Condensed",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Top spacer */}
      <div style={{ height: 48 }} />
    </>
  );
}

// Returns flags telling which tabs should show a notification dot
function useNavBadges(profileId, pathname) {
  const [badges, setBadges] = useState({ series: false, specials: false });

  useEffect(() => {
    if (!profileId) return;
    let alive = true;
    (async () => {
      try {
        const [
          { seriesMap },
          { data: userSeriesPicks },
          { data: openQs },
          { data: userAns },
        ] = await Promise.all([
          buildSeriesMap(),
          supabase
            .from("predictions")
            .select("series_key")
            .eq("user_id", profileId)
            .eq("type", "series"),
          supabase
            .from("special_questions")
            .select("id, deadline, correct_choice")
            .gt("deadline", new Date().toISOString())
            .is("correct_choice", null),
          supabase
            .from("special_answers")
            .select("question_id")
            .eq("user_id", profileId),
        ]);

        // Series badge: any pickable upcoming R2+ series without a series pick
        const pickedKeys = new Set((userSeriesPicks || []).map((p) => p.series_key));
        const seriesPending = Object.entries(seriesMap || {}).some(([key, s]) => {
          if (key.includes("_r1_")) return false;
          if (!s.teamA || !s.teamB) return false;
          if (s.status !== "upcoming") return false;
          return !pickedKeys.has(key);
        });

        // Specials badge: any open question without an answer
        const answered = new Set((userAns || []).map((a) => a.question_id));
        const specialsPending = (openQs || []).some((q) => !answered.has(q.id));

        if (alive)
          setBadges({ series: seriesPending, specials: specialsPending });
      } catch {
        // silent — badges are best-effort
      }
    })();
    return () => {
      alive = false;
    };
  }, [profileId, pathname]);

  return badges;
}
