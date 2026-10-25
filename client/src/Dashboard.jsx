import { useState } from "react";
import logo from "./assets/logo.png";
import { SKINS, skinImage } from "./skins";
import bg from "./assets/bg.png";
import "./Dashboard.css";

const DEFAULT_TREE = {
  stage: "Growing",
  day: 3,
  goalsDone: 2,
  goalsTotal: 3,
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
          <div
            className="dash-circle"
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
          <h2 className="dash-title">Daily tasks</h2>
          {tasks.map((task) => (
            <div key={task.id} className="dash-task">
              <span>{task.label}</span>{" "}
              {task.done ? (
                <span>Done ✓</span>
              ) : (
                <button type="button" onClick={() => onDoTask?.(task.id)}>
                  Do Task
                </button>
              )}
            </div>
          ))}

          {weekly && (
            <>
              <h2 className="dash-title">Weekly tasks</h2>
              <div className="dash-task">
                <span>
                  {weekly.label} ({weekly.count}/{weekly.target})
                </span>{" "}
                {weekly.done ? <span>Done ✓</span> : <span>+{weekly.xp} XP</span>}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}