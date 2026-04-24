import { useState, useEffect } from "react";
import { PLAYOFF_DEADLINE } from "../lib/constants";

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [over, setOver] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = PLAYOFF_DEADLINE - new Date();
      if (diff <= 0) {
        setOver(true);
        setTimeLeft(null);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const bannerStyle = {
    background: "var(--purple)",
    borderRadius: "var(--r)",
    padding: "8px 3px",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "inter",
    fontWeight: 700,
    letterSpacing: 0,
    fontSize: 12,
    color: "#fff",
  };

  if (over)
    return (
      <div style={bannerStyle}>
        🔒Initial picks over. Round 2 picks to open very soon.
      </div>
    );

  if (!timeLeft) return null;

  const { d, h, m, s } = timeLeft;

  return (
    <div style={bannerStyle}>
      ⏳Initial picks ends in{" "}
      {d > 0 && (
        <>
          <strong>{d} day(s)</strong>{" "}
        </>
      )}
      <strong>{String(h).padStart(2, "0")} hour(s)</strong>{" "}
      <strong>{String(m).padStart(2, "0")} min</strong>{" "}
      <strong>{String(s).padStart(2, "0")} sec</strong>!
    </div>
  );
}
