import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "./assets/logo.png";
import { EXERCISES, INITIAL_WORKOUTS } from "./workoutData";
import "./Workout.css";

const STORAGE_KEY = "rootine.workouts";
const MAX_PIPS = 10;

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

function summarize(sets) {
  const volume = sets.reduce(
    (total, s) => total + (s.weightKg != null ? s.sets * s.reps * s.weightKg : 0),
    0
  );
  const exercises = new Set(sets.map((s) => s.exercise)).size;
  return { count: sets.length, volume: Math.round(volume), exercises };
}

function Pips({ count }) {
  const shown = Math.min(count, MAX_PIPS);
  return (
    <div className="wk-pips" aria-label={`${count} ${count === 1 ? "set" : "sets"}`}>
      {Array.from({ length: shown }, (_, i) => (
        <i key={i} className="wk-pip on" />
      ))}
    </div>
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
  const previous = workouts.filter((w) => w.status === "COMPLETED").reverse();
  const stats = summarize(activeWorkout ? activeWorkout.sets : []);

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
      { workoutId: `wk-${Date.now()}`, status: "IN_PROGRESS", endTime: null, sets: [] },
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

  const emptyText = !isActive
    ? "Start a workout to begin logging sets."
    : "Nothing logged yet. One set is enough to keep your streak alive.";

  return (
    <div className="wk">
      <header className="wk-head">
        <Link to="/dashboard" aria-label="Go to dashboard">
          <img className="wk-logo" src={logo} alt="Rootine" />
        </Link>
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

      <main className="wk-session">
        <div className="wk-sessionhead">
          <h1 className="wk-title">{isActive ? "Today's session" : "No session"}</h1>
          <div className="wk-sessionactions">
            {isActive && <span className="wk-chip">In progress</span>}
            {isActive ? (
              <button type="button" className="wk-btn wk-btn--ghost" onClick={finishWorkout}>
                Finish
              </button>
            ) : (
              <button type="button" className="wk-btn" onClick={startWorkout}>
                Start workout
              </button>
            )}
          </div>
        </div>

        <div className="wk-stats">
          <div className="wk-stat">
            <b>{stats.count}</b>
            <span>Sets</span>
          </div>
          <div className="wk-stat">
            <b>{stats.volume.toLocaleString()}</b>
            <span>Volume (kg)</span>
          </div>
          <div className="wk-stat">
            <b>{stats.exercises}</b>
            <span>Exercises</span>
          </div>
        </div>

        {error && (
          <p className="wk-error" role="alert">
            {error}
          </p>
        )}

        <div className="wk-cols">
          <section>
            <h2 className="wk-h">Log a set</h2>
            <form className="wk-form" onSubmit={logSet}>
              <label className="wk-field">
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
              <div className="wk-row2">
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
              </div>
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
          </section>

          <section>
            <h2 className="wk-h">Sets</h2>
            {!isActive || activeWorkout.sets.length === 0 ? (
              <p className="wk-empty-box">{emptyText}</p>
            ) : (
              <ul className="wk-list">
                {activeWorkout.sets.map((set) => (
                  <li key={set.setId} className="wk-set">
                    <div>
                      <div className="wk-set-name">{set.exercise}</div>
                      <div className="wk-set-meta">
                        {set.sets} × {set.reps}
                        {set.weightKg != null ? ` @ ${set.weightKg} kg` : " · bodyweight"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="wk-link"
                      onClick={() => deleteSet(set.setId)}
                    >
                      Delete
                    </button>
                    <Pips count={set.sets} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {previous.length > 0 && (
          <section className="wk-prev">
            <h2 className="wk-h">Previous workouts</h2>
            <ul className="wk-tl">
              {previous.map((workout) => {
                const s = summarize(workout.sets);
                return (
                  <li key={workout.workoutId}>
                    <strong>{formatDateTime(workout.endTime)}</strong>
                    <p>
                      {s.exercises} {s.exercises === 1 ? "exercise" : "exercises"} · {s.count}{" "}
                      {s.count === 1 ? "set" : "sets"}
                      {workout.sets.length > 0 &&
                        ` · ${[...new Set(workout.sets.map((x) => x.exercise))].join(", ")}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
