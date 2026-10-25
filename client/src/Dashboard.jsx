import { useState } from "react";
import logo from "./assets/logo.png";
import { TREES, TreeIcon } from "./Cosmetics";
import "./Dashboard.css";

const DEFAULT_TASKS = [
  { id: 1, label: "10,000 steps", done: true },
  { id: 2, label: "Short workout", done: true },
  { id: 3, label: "Stretch for 5 minutes", done: false },
];

const DEFAULT_TREE = {
  stage: "Growing",
  day: 3,
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
  const [items, setItems] = useState(tasks);
  const equipped = TREES.find((t) => t.id === equippedId) ?? TREES[0];

  const goalsTotal = items.length;
  const goalsDone = items.filter((t) => t.done).length;
  const percent = goalsTotal ? Math.round((goalsDone / goalsTotal) * 100) : 0;

  function toggleTask(id) {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

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
              <b>{equipped.name}</b> · Day {tree.day} · {goalsDone} of {goalsTotal}{" "}
              goals today
            </p>
            <div
              className="dash-meter"
              role="img"
              aria-label={`${goalsDone} of ${goalsTotal} goals done`}
            >
              {items.map((_, i) => (
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
            <h2 className="dash-title">Tasks</h2>
            <span className="dash-count">
              {goalsDone} / {goalsTotal} done
            </span>
          </header>

          <div className="dash-progress" role="presentation">
            <i style={{ width: `${percent}%` }} />
          </div>

          <ul className="dash-tasks">
            {items.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  className={`dash-task${task.done ? " is-done" : ""}`}
                  aria-pressed={task.done}
                  onClick={() => toggleTask(task.id)}
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
        </aside>
      </div>
    </div>
  );
}
