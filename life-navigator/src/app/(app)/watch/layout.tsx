import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Life Navigator - Watch",
  description: "Watch mini view",
};

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="watch-viewport">
      {children}
      <style>{`
        /* Watch viewport - simulates round smartwatch screen */
        .watch-viewport {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #000;
          padding: 0;
          margin: 0;
        }

        .watch-container {
          width: 194px;
          height: 194px;
          border-radius: 50%;
          background: #111;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          position: relative;
          box-shadow: 0 0 0 4px #333, 0 0 0 6px #555;
          padding: 24px 16px 16px;
        }

        /* Tabs */
        .watch-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 6px;
          flex-shrink: 0;
        }
        .watch-tab {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 8px;
          border: none;
          background: #333;
          color: #888;
          cursor: pointer;
        }
        .watch-tab.active {
          background: #3b82f6;
          color: #fff;
        }

        /* Content area */
        .watch-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          overflow: hidden;
        }

        /* MIT view */
        .watch-progress {
          font-size: 22px;
          font-weight: 800;
          color: #22c55e;
          line-height: 1;
          margin-bottom: 4px;
        }
        .watch-tasks {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 0 8px;
        }
        .watch-task {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #222;
          border: none;
          border-radius: 6px;
          padding: 4px 6px;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        .watch-task.done {
          opacity: 0.5;
        }
        .watch-check {
          font-size: 11px;
          color: #22c55e;
          flex-shrink: 0;
          width: 14px;
        }
        .watch-task-text {
          font-size: 9px;
          color: #ddd;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .watch-task.done .watch-task-text {
          text-decoration: line-through;
          color: #666;
        }
        .watch-empty {
          font-size: 10px;
          color: #666;
          margin-top: 12px;
        }

        /* Score view */
        .watch-avg {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          margin-bottom: 6px;
        }
        .watch-scores {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 12px;
        }
        .watch-score-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .watch-score-label {
          font-size: 8px;
          color: #aaa;
          width: 30px;
          text-align: right;
        }
        .watch-score-bar-bg {
          flex: 1;
          height: 5px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
        }
        .watch-score-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }
        .watch-score-val {
          font-size: 8px;
          color: #aaa;
          width: 18px;
        }

        /* Override parent layout for watch page */
        @media (max-width: 220px) {
          .watch-container {
            width: 100vw;
            height: 100vh;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}
