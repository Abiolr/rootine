import { useState } from "react";
import logo from "./assets/logo.png";
import { SKINS, skinImage } from "./skins";
import bg from "./assets/bg.png";
import Chatbot from "./Chatbot";
import "./Dashboard.css";

const DEFAULT_TASKS = [
  { id: 1, label: "10,000 steps", done: true },
  { id: 2, label: "Short workout", done: true },
  { id: 3, label: "Stretch for 5 minutes", done: false },
];

const DEFAULT_TREE = {
  stage: "Growing",
  day: 3,
  penaltyPoints: 0,
};

export default function Dashboard({
  username = "Username",
  equippedId = "classic",
  tree = DEFAULT_TREE,
  tasks = [],
  weekly = null,
  initialTasksOpen = false,
  onDoTask,
  onCosmetics,
  onWorkout,
  onLogout,
}) {
  const [tasksOpen, setTasksOpen] = useState(initialTasksOpen);
  const equipped = SKINS.find((s) => s.id === equippedId) ?? SKINS[0];
  const treeImg = skinImage(equipped.id, tree.stage); // null for SEED: background only

  // Compute goals based on passed-in tasks prop instead of local state
  const goalsTotal = tasks.length;
  const goalsDone = tasks.filter((t) => t.done).length;
  const percent = goalsTotal ? Math.round((goalsDone / goalsTotal) * 100) : 0;

  return (
    <div className="dash">
      
      <header className="dash-head">
        {/* Left side: Logo only */}
        <img className="dash-logo" src={logo} alt="Rootine" />
        
        {/* Right side: Welcome message + Buttons */}
        <div className="dash-head-right">
          <span className="dash-user">Welcome! {username}</span>
          
          <nav className="dash-head-nav">
            <button
              type="button"
              className="dash-btn"
              aria-pressed={!tasksOpen}
              onClick={() => setTasksOpen(false)}
            >
              Tree
            </button>
            <button type="button" className="dash-btn" onClick={onWorkout}>
              Train
            </button>
            <button type="button" className="dash-btn" onClick={onCosmetics}>
              Cosmetics
            </button>
            <button
              type="button"
              className="dash-btn"
              id="dash-tasks-btn"
              aria-pressed={tasksOpen}
              aria-controls="dash-panel"
              onClick={() => setTasksOpen((open) => !open)}
            >
              Tasks
            </button>
            <button type="button" className="dash-btn" onClick={onLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="dash-stage">
        <div className={`dash-tree${tasksOpen ? " is-shifted" : ""}`}>
          <div
            className={`dash-circle ${tree.penaltyPoints === 1 ? 'is-warning' : ''}`}
            style={{
              position: "relative",
              overflow: "hidden",
              backgroundImage: `url(${bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              imageRendering: "pixelated",
            }}
          >
            {treeImg && (
              <img
                src={treeImg}
                alt={`${tree.stage} tree`}
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "22%",
                  width: "55%",
                  transform: "translateX(-50%)",
                  imageRendering: "pixelated",
                }}
              />
            )}
          </div>
          <section className="dash-status" aria-label="Tree status">
            <h3>{tree.stage}</h3>
            <p>
              <b>{equipped.name}</b> · Day {tree.day} · {goalsDone} of {goalsTotal}{" "}
              goals today
            </p>
            <div
              className="dash-meter"
              role="img"
              aria-label={`${goalsDone} of ${goalsTotal} goals done`}
            >
              {/* Bars fill from the left in order, so the count always matches the done total */}
              {tasks.map((_, i) => (
                <span key={i} className={i < goalsDone ? "is-on" : ""} />
              ))}
            </div>
            <p className="dash-status-foot">{percent}% of today's goals</p>
          </section>
        </div>

        <aside
          className={`dash-panel${tasksOpen ? " is-open" : ""}`}
          id="dash-panel"
          aria-label="Tasks"
        >
          <header className="dash-panel-head">
            <h2 className="dash-title">Daily tasks</h2>
            <span className="dash-count">
              {goalsDone} / {goalsTotal} done
            </span>
          </header>

          <div className="dash-progress" role="presentation">
            <i style={{ width: `${percent}%` }} />
          </div>

          <ul className="dash-tasks">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  className={`dash-task${task.done ? " is-done" : ""}`}
                  aria-pressed={task.done}
                  onClick={() => onDoTask?.(task.id)}
                >
                  <span className="dash-check" aria-hidden="true" />
                  <span className="dash-task-label">{task.label}</span>
                  <span className="dash-task-state">
                    {task.done ? "Done" : "To do"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {weekly && (
            <>
              <header className="dash-panel-head" style={{ marginTop: "1.5rem" }}>
                <h2 className="dash-title">Weekly tasks</h2>
              </header>
              <ul className="dash-tasks">
                <li>
                  <div className={`dash-task${weekly.done ? " is-done" : ""}`}>
                    <span className="dash-check" aria-hidden="true" />
                    <span className="dash-task-label">
                      {weekly.label} ({weekly.count}/{weekly.target})
                    </span>
                    <span className="dash-task-state" style={{ marginLeft: "auto" }}>
                      {weekly.done ? "Done ✓" : `+${weekly.xp} XP`}
                    </span>
                  </div>
                </li>
              </ul>
            </>
          )}
        </aside>
      </div>

      <Chatbot />
    </div>
  );
}