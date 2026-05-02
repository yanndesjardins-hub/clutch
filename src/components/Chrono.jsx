import { useState, useEffect } from "react";

const pad = (n) => String(n).padStart(2, "0");

function format(target) {
  if (!target) return null;
  const date = new Date(target);
  if (isNaN(date.getTime())) return null;
  const diff = date - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(m)}m ${pad(s)}s`;
}

export default function Chrono({ targetDate, prefix }) {
  const [text, setText] = useState(() => format(targetDate));

  useEffect(() => {
    setText(format(targetDate));
    const id = setInterval(() => setText(format(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!text) return null;
  return <>{prefix ? `${prefix} ${text}` : text}</>;
}
