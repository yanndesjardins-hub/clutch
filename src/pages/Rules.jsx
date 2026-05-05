import { PLAYOFF_DEADLINE } from "../lib/constants";

const deadline = PLAYOFF_DEADLINE.toLocaleDateString("en-US", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function Rules() {
  return (
    <div className="page fade-up">
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2
          className="condensed"
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          📋 Rules
        </h2>
        <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 4 }}>
          Clutch — NBA Playoffs 2026
        </p>
      </div>

      <Section emoji="🗓️" title="Initial Picks" subtitle={`Before ${deadline}`}>
        <p>
          Before the playoffs tip off, fill in{" "}
          <strong>the entire bracket</strong>: the series winner and number of
          games, from Round 1 to the NBA Finals.
        </p>
        <ScoreRow label="Correct series winner" pts="5 pts" />
        <ScoreRow
          label="Correct number of games"
          pts="+10 pts"
          sub="5 + 10 = 15 pts max per series"
        />
        <ScoreRow label="Conference Finalist" pts="10 pts" sub="per finalist" />
        <ScoreRow label="NBA Finalist (losing team)" pts="20 pts" />
        <ScoreRow label="NBA Champion 🏆" pts="50 pts" />
      </Section>

      <Section
        emoji="🔄"
        title="Series Picks"
        subtitle="Before Game 1 of each series (Round 2+)"
      >
        <p>
          When a series is about to start (from Round 2), you can{" "}
          <strong>update your pick</strong> for that matchup. Points stack with
          your initial picks and <strong>scale up by round</strong>.
        </p>
        <ScoreRow
          label="Semifinals (R2)"
          pts="4 + 8"
          sub="12 pts max per series"
        />
        <ScoreRow
          label="Conference Finals (R3)"
          pts="7 + 14"
          sub="21 pts max per series"
        />
        <ScoreRow
          label="NBA Finals"
          pts="10 + 20"
          sub="30 pts max"
        />
        <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 8 }}>
          💡 This lets you correct a wrong initial pick. Each round rewards
          more — getting deep series right pays off.
        </p>
      </Section>

      <Section emoji="📊" title="Points Stack">
        <p>
          Initial picks and series picks <strong>stack together</strong>.
          Example for Semifinals: pick the right winner upfront (5 pts) and
          confirm it at series start (4 pts) = <strong>9 pts</strong>. The
          stack grows up to <strong>15 + 30 = 45 pts</strong> for an NBA
          Finals matchup nailed at both stages.
        </p>
      </Section>

      <Section
        emoji="⭐"
        title="Special Questions"
        subtitle="Bonus questions throughout the playoffs"
      >
        <p>
          Throughout the playoffs, bonus multiple-choice questions are posted
          (e.g. <em>"Cumulated score of Game 7?"</em>). Each has its own{" "}
          <strong>deadline</strong> and <strong>point value</strong> (3 to 15
          pts depending on difficulty).
        </p>
        <ScoreRow label="Correct answer" pts="+ Question's pts" />
        <ScoreRow label="Wrong answer or skipped" pts="0 pts" sub="no penalty" />
        <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 8 }}>
          💡 Specials stack with everything else — a great way to climb the
          leaderboard if your bracket goes off the rails.
        </p>
      </Section>

      <Section emoji="⏰" title="Key Deadlines">
        <ScoreRow label="Initial picks deadline" pts={deadline} />
        <ScoreRow label="Series picks" pts="Before Game 1 (Round 2+)" />
        <ScoreRow label="Special questions" pts="Per question" />
        <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 8 }}>
          Once a deadline passes, those picks are locked.
        </p>
      </Section>

      <div
        className="card"
        style={{
          background: "var(--purple-bg)",
          borderColor: "rgba(145,112,255,0.25)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--purple)",
            fontFamily: "Barlow Condensed",
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          THEORETICAL MAXIMUM SCORE (excluding special questions)
        </div>
        <div
          className="condensed"
          style={{ fontSize: 48, fontWeight: 900, color: "var(--purple)" }}
        >
          {15 * 15 + 4 * 12 + 2 * 21 + 1 * 30 + 10 * 2 + 20 + 50}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
          points (nearly impossible 😅)
        </div>
      </div>
    </div>
  );
}

function Section({ emoji, title, subtitle, children }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <div>
          <div
            className="condensed"
            style={{ fontWeight: 800, fontSize: 17, letterSpacing: 1 }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: 13,
          color: "var(--text2)",
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ScoreRow({ label, pts, sub }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "var(--text2)", fontSize: 13 }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span
          className="condensed"
          style={{ fontWeight: 800, fontSize: 15, color: "var(--purple)" }}
        >
          {pts}
        </span>
        {sub && (
          <div style={{ fontSize: 10, color: "var(--text3)" }}>{sub}</div>
        )}
      </div>
    </div>
  );
}
