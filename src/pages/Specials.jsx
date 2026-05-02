import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import Countdown from "../components/Countdown";
import Chrono from "../components/Chrono";
import SpecialAnswerModal from "../components/SpecialAnswerModal";

// Question lifecycle: open / closed / resolved
function getStatus(q) {
  if (q.correct_choice != null) return "resolved";
  if (new Date(q.deadline) <= new Date()) return "closed";
  return "open";
}

export default function Specials({ profile }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // by question_id
  const [modal, setModal] = useState(null);
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

  async function saveAnswer({ questionId, choice }) {
    await supabase.from("special_answers").upsert(
      {
        user_id: profile.id,
        question_id: questionId,
        choice,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,question_id" },
    );
    await load();
    setModal(null);
  }

  if (loading)
    return (
      <div className="page text-center" style={{ paddingTop: 60 }}>
        🏀 Loading specials…
      </div>
    );

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
          <Section label="Open" items={open}>
            {open.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                userAnswer={answers[q.id]}
                status="open"
                onAnswerClick={() => setModal({ question: q })}
              />
            ))}
          </Section>

          <Section label="Awaiting result" items={closed}>
            {closed.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                userAnswer={answers[q.id]}
                status="closed"
              />
            ))}
          </Section>

          <Section label="Resolved" items={resolved}>
            {resolved.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                userAnswer={answers[q.id]}
                status="resolved"
              />
            ))}
          </Section>
        </>
      )}

      {modal && (
        <SpecialAnswerModal
          question={modal.question}
          currentAnswer={answers[modal.question.id]}
          onSave={(pick) =>
            saveAnswer({ questionId: modal.question.id, ...pick })
          }
          onClose={() => setModal(null)}
        />
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

function QuestionCard({ question, userAnswer, status, onAnswerClick }) {
  const isOpen = status === "open";
  const isResolved = status === "resolved";
  const hasAnswered = userAnswer != null;
  const isCorrect = isResolved && userAnswer?.choice === question.correct_choice;
  const earnedPts = isResolved && isCorrect ? question.points : 0;

  // Card visual state (mirrors Series cards)
  const pickable = isOpen;
  const cardStyle =
    pickable && !hasAnswered
      ? {
          borderColor: "#9170ff",
          background: "rgba(145, 112, 255, 0.2)",
        }
      : isOpen
        ? { borderColor: "#9170ff" }
        : {};

  const statusColor =
    status === "open"
      ? "#9170ff"
      : status === "closed"
        ? "var(--text3)"
        : "var(--green)";
  const statusLabel =
    status === "open"
      ? "⏳ OPEN"
      : status === "closed"
        ? "⏸ AWAITING RESULT"
        : "✅ RESOLVED";

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
        {isOpen && (
          <button className="btn btn-ghost btn-sm" onClick={onAnswerClick}>
            {hasAnswered ? "Edit answer" : "+ Add answer"}
          </button>
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

      {/* Choices (read-only display) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {question.choices.map((c, i) => {
          const isUserChoice = userAnswer?.choice === i;
          const isCorrectChoice = isResolved && i === question.correct_choice;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "8px 12px",
                borderRadius: "var(--r)",
                background: isCorrectChoice
                  ? "rgba(64, 199, 119, 0.15)"
                  : isUserChoice
                    ? "rgba(145, 112, 255, 0.12)"
                    : "var(--bg3)",
                border: `1px solid ${
                  isCorrectChoice
                    ? "var(--green)"
                    : isUserChoice
                      ? "#9170ff"
                      : "var(--border)"
                }`,
                fontSize: 13,
                color: isCorrectChoice
                  ? "var(--green)"
                  : isUserChoice
                    ? "#fff"
                    : "var(--text2)",
                fontWeight: isCorrectChoice || isUserChoice ? 700 : 500,
              }}
            >
              <span>{c}</span>
              <span style={{ fontSize: 12 }}>
                {isCorrectChoice ? "✓" : isUserChoice && !isResolved ? "•" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer: reward + result */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
        }}
      >
        <span style={{ color: "var(--text3)" }}>
          Reward: <strong style={{ color: "var(--text2)" }}>{question.points} pts</strong>
        </span>
        {isResolved && hasAnswered && (
          <span
            style={{
              fontFamily: "inter",
              fontWeight: 700,
              color: isCorrect ? "var(--green)" : "var(--red)",
            }}
          >
            {isCorrect ? `+${earnedPts} pts ✓` : "0 pts ✗"}
          </span>
        )}
        {isResolved && !hasAnswered && (
          <span style={{ color: "var(--text3)" }}>No answer</span>
        )}
      </div>
    </div>
  );
}
