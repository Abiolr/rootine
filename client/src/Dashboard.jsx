import { useState } from "react";
import logo from "./assets/logo.png";
import { TREES, TreeIcon } from "./Cosmetics";
import "./Dashboard.css";

const DEFAULT_TASKS = [
  { id: 1, label: "Task one" },
  { id: 2, label: "Task two" },
  { id: 3, label: "Task three" },
];

const DEFAULT_TREE = {
  stage: "Growing",
  day: 3,
  goalsDone: 2,
  goalsTotal: 3,
};

export default function Dashboard({
  username = "Username",
  equippedId = "sapling",
  tree = DEFAULT_TREE,
  tasks = DEFAULT_TASKS,
  onCosmetics,
  onWorkout,
  onLogout,
}) {
  const [tasksOpen, setTasksOpen] = useState(false);
  const equipped = TREES.find((t) => t.id === equippedId) ?? TREES[0];
  const goalsTotal = tree.goalsTotal;

  return (
    <div className="dash">
      <header className="dash-head">
        <img className="dash-logo" src={logo} alt="Rootine" />
        <span className="dash-user">{username}</span>
      </header>

      <nav className="dash-nav">
        <div className="dash-left">
          <button
            type="button"
            className="dash-link"
            aria-pressed={!tasksOpen}
            onClick={() => setTasksOpen(false)}
          >
            Tree
          </button>
          <button type="button" className="dash-link" onClick={onWorkout}>
            Train
          </button>
        </div>
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
            <TreeIcon
              shape={equipped.shape}
              color={equipped.color}
              width={240}
              height={280}
            />
          </div>
          <section className="dash-status" aria-label="Tree status">
            <h3>{tree.stage}</h3>
            <p>
              <b>{equipped.name}</b> · Day {tree.day} · {tree.goalsDone} of{" "}
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
