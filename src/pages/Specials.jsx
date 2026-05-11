import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import Countdown from "../components/Countdown";
import Chrono from "../components/Chrono";

// Question lifecycle: open / closed / resolved
function getStatus(q) {
  if (q.correct_choice != null) return "resolved";
  if (new Date(q.deadline) <= new Date()) return "closed";
  return "open";
}

export default function Specials({ profile }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // by question_id
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [{ data: qData }, { data: aData }] = await Promise.all([
        supabase
          .from("special_questions")
          .select("*")
          .order("deadline", { ascending: true }),
        supabase
          .from("special_answers")
          .select("*")
          .eq("user_id", profile.id),
      ]);
      setQuestions(qData || []);
      const aMap = {};
      (aData || []).forEach((a) => {
        aMap[a.question_id] = a;
      });
      setAnswers(aMap);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Tap a choice = save instantly with optimistic update
  async function handleChoiceClick(questionId, choice) {
    // Optimistic local update
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        user_id: profile.id,
        question_id: questionId,
        choice,
      },
    }));
    const { error } = await supabase.from("special_answers").upsert(
      {
        user_id: profile.id,
        question_id: questionId,
        choice,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,question_id" },
    );
    if (error) {
      // Revert by reloading from server
      await load();
    }
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
        Loading specials…
      </div>
    );

  // Stable question number (1-based) based on master sort order (by deadline asc).
  const numberById = new Map(questions.map((q, i) => [q.id, i + 1]));

  // Group by status
  const open = [];
  const closed = [];
  const resolved = [];
  questions.forEach((q) => {
    const s = getStatus(q);
    if (s === "open") open.push(q);
    else if (s === "closed") closed.push(q);
    else resolved.push(q);
  });
  // Resolved sorted: most recently resolved first (use updated_at)
  resolved.sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  );

  return (
    <div className="page fade-up">
      <Countdown />

      {questions.length === 0 ? (
        <div
          className="card text-center"
          style={{ padding: 40, color: "var(--text3)" }}
        >
          No special questions yet — stay tuned!
        </div>
      ) : (
        <>
          <Section label="Special questions" items={open}>
            {open.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                number={numberById.get(q.id)}
                userAnswer={answers[q.id]}
                status="open"
                onChoiceClick={(choice) => handleChoiceClick(q.id, choice)}
              />
            ))}
          </Section>

          <Section label="Awaiting result" items={closed}>
            {closed.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                number={numberById.get(q.id)}
                userAnswer={answers[q.id]}
                status="closed"
              />
            ))}
          </Section>

          <Section label="Passed" items={resolved}>
            {resolved.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                number={numberById.get(q.id)}
                userAnswer={answers[q.id]}
                status="resolved"
              />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ label, items, children }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "1px solid var(--text3)",
        }}
      >
        <span
          className="condensed"
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "var(--text3)",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function QuestionCard({ question, number, userAnswer, status, onChoiceClick }) {
  const isOpen = status === "open";
  const isResolved = status === "resolved";
  const hasAnswered = userAnswer != null;
  const isCorrect = isResolved && userAnswer?.choice === question.correct_choice;
  const earnedPts = isResolved && isCorrect ? question.points : 0;

  const cardStyle = isOpen ? { borderColor: "#9170ff" } : {};

  const statusColor =
    status === "open"
      ? "#9170ff"
      : "var(--text3)";
  const statusLabel =
    status === "open"
      ? "⏳ OPEN"
      : status === "closed"
        ? "⏸ AWAITING RESULT"
        : "PASSED";

  // Top-right result indicator (resolved only)
  const resultBadge = isResolved
    ? hasAnswered
      ? {
          text: isCorrect ? `+${earnedPts} pts ✓` : "0 pts ✗",
          color: isCorrect ? "var(--green)" : "var(--red)",
        }
      : { text: "No answer", color: "var(--text3)" }
    : null;

  return (
    <div className="card" style={cardStyle}>
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
        {resultBadge && (
          <span
            style={{
              fontFamily: "inter",
              fontWeight: 700,
              fontSize: 12,
              color: resultBadge.color,
            }}
          >
            {resultBadge.text}
          </span>
        )}
      </div>

      {/* Deadline chrono (open only) */}
      {isOpen && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 8,
            fontFamily: "inter",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text3)",
          }}
        >
          <Chrono targetDate={question.deadline} prefix="Closes in" />
        </div>
      )}

      {/* Question text */}
      <div
        style={{
          fontFamily: "inter",
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1.4,
          color: "var(--text2)",
          marginBottom: 12,
        }}
      >
        {question.question_text}
      </div>

      {/* Choices — 2-column grid, tap-to-answer when open */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}
      >
        {question.choices.map((c, i) => {
          const isUserChoice = userAnswer?.choice === i;
          const isCorrectChoice = isResolved && i === question.correct_choice;

          // Compute styling per state
          let bg = "var(--bg3)";
          let border = "var(--border)";
          let color = "var(--text2)";
          let weight = 500;
          let icon = "";

          if (!isResolved) {
            // OPEN / AWAITING — purple highlight on user's pick
            if (isUserChoice) {
              bg = "rgba(145, 112, 255, 0.12)";
              border = "#9170ff";
              color = "#fff";
              weight = 700;
              if (isOpen) icon = "•";
            }
          } else if (isCorrect) {
            // User won — highlight the (correct = user's) choice in green
            if (isCorrectChoice) {
              bg = "rgba(64, 199, 119, 0.15)";
              border = "var(--green)";
              color = "var(--green)";
              weight = 700;
              icon = "✓";
            }
          } else {
            // User lost OR didn't answer
            //  - user's wrong pick in red with ✗
            //  - correct answer subtly highlighted in gray with ✓
            if (hasAnswered && isUserChoice) {
              bg = "rgba(255, 80, 80, 0.12)";
              border = "var(--red)";
              color = "var(--red)";
              weight = 700;
              icon = "✗";
            } else if (isCorrectChoice) {
              bg = "rgba(170, 170, 170, 0.14)";
              border = "var(--text3)";
              icon = "✓";
            }
          }

          const clickable = isOpen;
          return (
            <div
              key={i}
              className={clickable ? "specials-choice-open" : undefined}
              onClick={
                clickable ? () => onChoiceClick && onChoiceClick(i) : undefined
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 12px",
                minHeight: 42,
                borderRadius: "var(--r)",
                background: bg,
                border: `1px solid ${border}`,
                fontSize: 13,
                color,
                fontWeight: weight,
                cursor: clickable ? "pointer" : "default",
                userSelect: "none",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <span style={{ flex: 1 }}>{c}</span>
              {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
            </div>
          );
        })}
      </div>

      {/* Footer: reward (left) + question number (right) */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "var(--text3)",
        }}
      >
        <span>
          Reward:{" "}
          <strong style={{ color: "var(--text2)" }}>
            {question.points} pts
          </strong>
        </span>
        {number != null && (
          <span style={{ color: "var(--text3)" }}>
            #{String(number).padStart(2, "0")}
          </span>
        )}
      </div>
    </div>
  );
}
