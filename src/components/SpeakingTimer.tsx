import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  startedAt: string | null;
  durationSeconds: number;
  paused: boolean;
  className?: string;
}

/**
 * Circular countdown timer synced to a server timestamp so every viewer sees
 * the same remaining time.
 */
const SpeakingTimer = ({ startedAt, durationSeconds, paused, className }: Props) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || paused) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt, paused]);

  const elapsed = startedAt ? Math.max(0, (now - new Date(startedAt).getTime()) / 1000) : 0;
  const remaining = Math.max(0, durationSeconds - elapsed);
  const pct = startedAt ? Math.min(1, elapsed / durationSeconds) : 0;

  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60).toString().padStart(2, "0");

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  const danger = remaining <= 10 && startedAt && !paused;

  return (
    <div className={cn("relative h-20 w-20", className)}>
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={radius} className="fill-none stroke-secondary" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={radius}
          className={cn("fill-none transition-[stroke-dashoffset] duration-300 ease-linear", danger ? "stroke-destructive" : "stroke-preply-pink")}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-lg font-bold tabular-nums", danger ? "text-destructive" : "text-foreground")}>
          {startedAt ? `${mm}:${ss}` : "--:--"}
        </span>
      </div>
    </div>
  );
};

export default SpeakingTimer;