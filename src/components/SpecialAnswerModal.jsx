import { useState, useEffect } from "react";
import ReactDOM from "react-dom";

export default function SpecialAnswerModal({ question, currentAnswer, onSave, onClose }) {
  const [choice, setChoice] = useState(
    currentAnswer != null ? currentAnswer.choice : null,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSave() {
    if (choice == null) return;
    setBusy(true);
    await onSave({ choice });
    setBusy(false);
  }

  return ReactDOM.createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        className="fade-up"
        style={{
          background: "var(--bg2)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          padding: 20,
          width: "100%",
          maxWidth: 440,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3
            className="condensed"
            style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2 }}
          >
            YOUR ANSWER
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text3)",
              fontSize: 24,
              cursor: "pointer",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Question text */}
        <p
          style={{
            fontFamily: "inter",
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.4,
            color: "var(--text2)",
            marginBottom: 16,
          }}
        >
          {question.question_text}
        </p>

        {/* Reward */}
        <p className="label" style={{ marginBottom: 8 }}>
          Reward: {question.points} pts
        </p>

        {/* Choices */}
        <p className="label">Pick your answer</p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {question.choices.map((c, i) => (
            <button
              key={i}
              onClick={() => setChoice(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                background:
                  choice === i ? "rgba(145, 112, 255, 0.18)" : "var(--bg3)",
                border: `2px solid ${choice === i ? "#9170ff" : "var(--border)"}`,
                borderRadius: "var(--r)",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  className="condensed"
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: choice === i ? "#fff" : "var(--text2)",
                  }}
                >
                  {c}
                </div>
              </div>
              {choice === i && (
                <span style={{ color: "#9170ff", fontSize: 20 }}>✓</span>
              )}
            </button>
          ))}
        </div>

        <button
          className="btn btn-purple btn-full"
          onClick={handleSave}
          disabled={busy || choice == null}
        >
          {busy ? "…" : "Confirm my answer ✓"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
