import { useState } from "react";
import logo from "./assets/logo.png";
import "./Dashboard.css";

const DEFAULT_TASKS = [
  { id: 1, label: "Task one" },
  { id: 2, label: "Task two" },
  { id: 3, label: "Task three" },
];

const DEFAULT_TREE = {
  stage: "Growing",
  level: "Sapling",
  day: 3,
  goalsDone: 2,
  goalsTotal: 3,
};

function TreeIcon() {
  return (
    <svg
      viewBox="0 0 12 14"
      shapeRendering="crispEdges"
      width="96"
      height="112"
      role="img"
      aria-label="Your tree"
    >
      <path
        fill="#cfe97a"
        d="M4 0h4v1h-4zM3 1h6v1h-6zM2 2h8v1h-8zM1 3h10v1h-10zM1 4h10v1h-10zM2 5h8v1h-8zM1 6h10v1h-10zM0 7h12v1h-12zM1 8h10v1h-10zM2 9h8v1h-8z"
      />
      <path fill="#f2a65a" d="M5 10h2v3h-2z" />
      <path fill="#1f5a43" d="M2 13h8v1h-8z" />
    </svg>
  );
}

export default function Dashboard({
  username = "Username",
  tree = DEFAULT_TREE,
  tasks = DEFAULT_TASKS,
  onCosmetics,
  onLogout,
}) {
  const [tasksOpen, setTasksOpen] = useState(false);
  const goalsTotal = tree.goalsTotal;

  return (
    <div className="dash">
      <header className="dash-head">
        <img className="dash-logo" src={logo} alt="Rootine" />
        <span className="dash-user">{username}</span>
      </header>

      <nav className="dash-nav">
        <button
          type="button"
          className="dash-link"
          aria-pressed={!tasksOpen}
          onClick={() => setTasksOpen(false)}
        >
          Tree
        </button>
        <div className="dash-right">
          <button type="button" className="dash-btn" onClick={onCosmetics}>
            Cosmetics
          </button>
          <button type="button" className="dash-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dash-bar">
        <button
          type="button"
          className="dash-btn dash-btn--small"
          id="dash-tasks-btn"
          aria-pressed={tasksOpen}
          aria-controls="dash-panel"
          onClick={() => setTasksOpen((open) => !open)}
        >
          Tasks
        </button>
      </div>

      <div className="dash-stage">
        <div className={`dash-tree${tasksOpen ? " is-shifted" : ""}`}>
          <div className="dash-circle">
            <TreeIcon />
          </div>
          <section className="dash-status" aria-label="Tree status">
            <h3>{tree.stage}</h3>
            <p>
              <b>{tree.level}</b> · Day {tree.day} · {tree.goalsDone} of{" "}
              {goalsTotal} goals today
            </p>
            <div
              className="dash-meter"
              role="img"
              aria-label={`${tree.goalsDone} of ${goalsTotal} goals done`}
            >
              {Array.from({ length: goalsTotal }, (_, i) => (
                <span key={i} className={i < tree.goalsDone ? "is-on" : ""} />
              ))}
            </div>
          </section>
        </div>

        <aside
          className={`dash-panel${tasksOpen ? " is-open" : ""}`}
          id="dash-panel"
          aria-label="Tasks"
        >
          <h2 className="dash-title">Tasks</h2>
          {tasks.map((task) => (
            <button key={task.id} type="button" className="dash-task">
              {task.label}
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
