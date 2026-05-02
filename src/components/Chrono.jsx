import { useState, useEffect } from "react";

const pad = (n) => String(n).padStart(2, "0");

function compute(target) {
  if (!target) return null;
  const date = new Date(target);
  if (isNaN(date.getTime())) return null;
  const diff = date - new Date();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export default function Chrono({ targetDate, prefix }) {
  const [t, setT] = useState(() => compute(targetDate));

  useEffect(() => {
    setT(compute(targetDate));
    const id = setInterval(() => setT(compute(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!t) return null;
  const { d, h, m, s } = t;
  return (
    <>
      {prefix && `${prefix} `}
      {d > 0 && (
        <>
          <strong>{d} day(s)</strong>{" "}
        </>
      )}
      <strong>{pad(h)} hour(s)</strong>{" "}
      <strong>{pad(m)} min</strong>{" "}
      <strong>{pad(s)} sec</strong>
    </>
  );
}
