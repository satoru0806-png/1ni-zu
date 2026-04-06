"use client";
import { useEffect, useState } from "react";
import { getTodayTheme, type DailyTheme } from "@/lib/daily-themes";

type DayLog = {
  mit1: string | null;
  mit2: string | null;
  mit3: string | null;
  relationshipScore: number;
  moneyScore: number;
  workScore: number;
  healthScore: number;
};

export default function WatchPage() {
  const [data, setData] = useState<DayLog | null>(null);
  const [view, setView] = useState<"theme" | "mit" | "score">("theme");
  const [theme] = useState<DailyTheme>(() => getTodayTheme());

  useEffect(() => {
    fetch("/api/daylog").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="watch-container"><p className="watch-empty">Loading...</p></div>;

  const tasks = [data.mit1, data.mit2, data.mit3].filter(Boolean) as string[];
  const avg = Math.round(
    (data.relationshipScore + data.moneyScore + data.workScore + data.healthScore) / 4
  );

  return (
    <div className="watch-container">
      <div className="watch-tabs">
        <button onClick={() => setView("theme")} className={`watch-tab ${view === "theme" ? "active" : ""}`}>今日</button>
        <button onClick={() => setView("mit")} className={`watch-tab ${view === "mit" ? "active" : ""}`}>最優先</button>
        <button onClick={() => setView("score")} className={`watch-tab ${view === "score" ? "active" : ""}`}>スコア</button>
      </div>

      {view === "theme" && (
        <div className="watch-content" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "4px" }}>{theme.emoji}</div>
          <div style={{ fontSize: "0.85rem", fontWeight: "bold", marginBottom: "4px" }}>{theme.title}</div>
          <div style={{ fontSize: "0.65rem", color: "#666", lineHeight: 1.3 }}>{theme.prompt}</div>
        </div>
      )}

      {view === "mit" && (
        <div className="watch-content">
          <div className="watch-progress">{tasks.length}/3</div>
          <div className="watch-tasks">
            {tasks.length > 0 ? tasks.map((t, i) => (
              <div key={i} className="watch-task">
                <span className="watch-check">{"\u25CB"}</span>
                <span className="watch-task-text">{t}</span>
              </div>
            )) : (
              <p className="watch-empty">未登録</p>
            )}
          </div>
        </div>
      )}

      {view === "score" && (
        <div className="watch-content">
          <div className="watch-avg">{avg}</div>
          <div className="watch-scores">
            <ScoreBar label="Rel" value={data.relationshipScore} color="#ec4899" />
            <ScoreBar label="Money" value={data.moneyScore} color="#eab308" />
            <ScoreBar label="Work" value={data.workScore} color="#3b82f6" />
            <ScoreBar label="Health" value={data.healthScore} color="#22c55e" />
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="watch-score-row">
      <span className="watch-score-label">{label}</span>
      <div className="watch-score-bar-bg">
        <div className="watch-score-bar-fill" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="watch-score-val">{value}</span>
    </div>
  );
}
