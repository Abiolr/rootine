import { useEffect, useState } from "react";
import logo from "./assets/logo.png";
import { EXERCISES, INITIAL_WORKOUTS } from "./workoutData";
import "./Workout.css";

const STORAGE_KEY = "rootine.workouts";

function loadWorkouts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable or corrupt: fall back to the hardcoded data */
  }
  return INITIAL_WORKOUTS;
}

function saveWorkouts(workouts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  } catch {
    /* storage unavailable: data lasts until the page is closed */
  }
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SetLine({ set }) {
  return (
    <span>
      {" "}
      {set.sets} × {set.reps}
      {set.weightKg != null ? ` @ ${set.weightKg} kg` : " · bodyweight"}
    </span>
  );
}

export default function Workout({ lifetimeXp = 0, onTree, onLogout }) {
  const [workouts, setWorkouts] = useState(loadWorkouts);
  const [error, setError] = useState("");

  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("8");
  const [weightKg, setWeightKg] = useState("40");

  useEffect(() => {
    saveWorkouts(workouts);
  }, [workouts]);

  const activeWorkout = workouts.find((w) => w.status === "IN_PROGRESS") ?? null;
  const isActive = Boolean(activeWorkout);
  // Completed workouts, newest first. They stay saved when a new workout starts.
  const previous = workouts.filter((w) => w.status === "COMPLETED").reverse();

  function updateActive(updater) {
    setWorkouts((prev) =>
      prev.map((w) => (w.status === "IN_PROGRESS" ? updater(w) : w))
    );
  }

  function startWorkout() {
    if (activeWorkout) {
      setError("You already have a workout in progress. Finish it first.");
      return;
    }
    setError("");
    setWorkouts((prev) => [
      ...prev,
      {
        workoutId: `wk-${Date.now()}`,
        status: "IN_PROGRESS",
        endTime: null,
        sets: [],
      },
    ]);
  }

  function finishWorkout() {
    setError("");
    setWorkouts((prev) =>
      prev.map((w) =>
        w.status === "IN_PROGRESS"
          ? { ...w, status: "COMPLETED", endTime: new Date().toISOString() }
          : w
      )
    );
  }

  function logSet(e) {
    e.preventDefault();
    if (!activeWorkout) return setError("Start a workout first.");
    if (!exercise) return setError("Choose an exercise.");
    const setCount = Number(sets);
    const repCount = Number(reps);
    if (!setCount || !repCount) return setError("Sets and reps must be at least 1.");

    setError("");
    const newSet = {
      setId: `set-${Date.now()}`,
      workoutId: activeWorkout.workoutId,
      exercise,
      sets: setCount,
      reps: repCount,
      weightKg: weightKg === "" ? null : Number(weightKg),
      date: new Date().toISOString(),
    };
    updateActive((w) => ({ ...w, sets: [newSet, ...w.sets] }));
    setExercise("");
  }

  function deleteSet(setId) {
    setError("");
    updateActive((w) => ({ ...w, sets: w.sets.filter((s) => s.setId !== setId) }));
  }

  let emptyText = "Start a workout to begin logging sets.";
  if (isActive && activeWorkout.sets.length === 0) {
    emptyText = "Nothing logged yet. One set is enough to keep your streak alive.";
  }

  return (
    <div className="wk">
      <header className="wk-head">
        <img className="wk-logo" src={logo} alt="Rootine" />
        <span className="wk-pill">{lifetimeXp} XP</span>
      </header>

      <nav className="wk-nav" aria-label="Main">
        <button type="button" className="wk-tab" onClick={onTree}>
          Tree
        </button>
        <div className="wk-right">
          <button type="button" className="wk-navbtn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="wk-panel">
        <div className="wk-titlebar">
          <h1 className="wk-title">Workout</h1>
          {isActive ? (
            <button type="button" className="wk-btn wk-btn--ghost" onClick={finishWorkout}>
              Finish workout
            </button>
          ) : (
            <button type="button" className="wk-btn" onClick={startWorkout}>
              Start workout
            </button>
          )}
        </div>

        {error && (
          <p className="wk-error" role="alert">
            {error}
          </p>
        )}

        <form className="wk-form" onSubmit={logSet}>
          <label className="wk-field wk-field--exercise">
            <span>Exercise</span>
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              disabled={!isActive}
            >
              <option value="">Choose an exercise</option>
              {EXERCISES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="wk-field">
            <span>Sets</span>
            <input
              type="number"
              min="1"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              disabled={!isActive}
            />
          </label>
          <label className="wk-field">
            <span>Reps</span>
            <input
              type="number"
              min="1"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              disabled={!isActive}
            />
          </label>
          <label className="wk-field">
            <span>Weight (kg)</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              disabled={!isActive}
            />
          </label>
          <button type="submit" className="wk-btn" disabled={!isActive}>
            Log sets
          </button>
        </form>

        <h2 className="wk-section">Today</h2>
        {!isActive ? (
          <p className="wk-empty">{emptyText}</p>
        ) : activeWorkout.sets.length === 0 ? (
          <p className="wk-empty">{emptyText}</p>
        ) : (
          <ul className="wk-list">
            {activeWorkout.sets.map((set) => (
              <li key={set.setId} className="wk-item">
                <div>
                  <strong>{set.exercise}</strong>
                  <SetLine set={set} />
                </div>
                <button
                  type="button"
                  className="wk-link"
                  onClick={() => deleteSet(set.setId)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {previous.length > 0 && (
          <>
            <h2 className="wk-section">Previous workouts</h2>
            {previous.map((workout) => (
              <div key={workout.workoutId}>
                <p className="wk-empty">
                  <strong>{formatDateTime(workout.endTime)}</strong>
                  {" · "}
                  {workout.sets.length} {workout.sets.length === 1 ? "set" : "sets"}
                </p>
                {workout.sets.length > 0 && (
                  <ul className="wk-list">
                    {workout.sets.map((set) => (
                      <li key={set.setId} className="wk-item">
                        <div>
                          <strong>{set.exercise}</strong>
                          <SetLine set={set} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
