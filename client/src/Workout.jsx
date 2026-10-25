import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "./assets/logo.png";
import { EXERCISES } from "./workoutData";
import { incrementWeekly, WEEKLY_TASK } from "./tasks";
import {
  getUser,
  getProfile,
  addXp,
  startWorkout as apiStartWorkout,
  completeWorkout as apiCompleteWorkout,
  createSet,
  deleteSet as apiDeleteSet,
} from "./api";
import Chatbot from "./Chatbot";
import "./Workout.css";

const XP_PER_WORKOUT = 5;
const MILESTONE_WORKOUTS = 5; // completing this many workouts...
const MILESTONE_XP = 100; // ...earns a one-time bonus
const MAX_PIPS = 10;

// The API has no "list workouts" endpoint yet, so history is cached per user in the browser.
const storageKey = () => `rootine.workouts.${getUser().userId}`;

function loadWorkouts() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable or corrupt */
  }
  return [];
}

function saveWorkouts(workouts) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(workouts));
  } catch {
    /* storage unavailable */
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

export default function Workout({ onTree, onLogout }) {
  const [workouts, setWorkouts] = useState(loadWorkouts);
  const [lifetimeXp, setLifetimeXp] = useState(() => getProfile().xp);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("8");
  const [weightKg, setWeightKg] = useState("40");

  useEffect(() => {
    saveWorkouts(workouts);
  }, [workouts]);

  const activeWorkout = workouts.find((w) => w.status === "IN_PROGRESS") ?? null;
  const isActive = Boolean(activeWorkout);
  // Completed workouts, newest first.
  const previous = workouts.filter((w) => w.status === "COMPLETED").reverse();
  const stats = summarize(activeWorkout ? activeWorkout.sets : []);

  function updateActive(updater) {
    setWorkouts((prev) => prev.map((w) => (w.status === "IN_PROGRESS" ? updater(w) : w)));
  }

  async function startWorkout() {
    if (activeWorkout) {
      setError("You already have a workout in progress. Finish it first.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const created = await apiStartWorkout();
      setWorkouts((prev) => [...prev, { ...created, sets: [] }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function finishWorkout() {
    if (!activeWorkout) return;
    setError("");
    setBusy(true);
    try {
      const done = await apiCompleteWorkout(activeWorkout.workoutId);
      const completedCount = workouts.filter((w) => w.status === "COMPLETED").length + 1;
      const weekly = incrementWeekly(); // weekly task: 5 workouts in a week
      const earned =
        XP_PER_WORKOUT +
        (completedCount === MILESTONE_WORKOUTS ? MILESTONE_XP : 0) +
        (weekly.justCompleted ? WEEKLY_TASK.xp : 0);

      updateActive((w) => ({
        ...w,
        status: "COMPLETED",
        endTime: done.endTime ?? new Date().toISOString(),
      }));

      try {
        const profile = await addXp(earned);
        setLifetimeXp(profile.xp);
      } catch (xpErr) {
        console.error("Failed to add XP", xpErr);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddSet(e) {
    e.preventDefault();
    if (!activeWorkout) return;
    setError("");
    setBusy(true);

    const payload = {
      workoutId: activeWorkout.workoutId,
      exercise,
      sets: parseInt(sets, 10),
      reps: parseInt(reps, 10),
      weightKg: weightKg ? parseFloat(weightKg) : null,
    };

    try {
      const newSet = await createSet(payload);
      updateActive((w) => ({ ...w, sets: [...w.sets, newSet] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveSet(setId) {
    setError("");
    try {
      await apiDeleteSet(setId);
      updateActive((w) => ({
        ...w,
        sets: w.sets.filter((s) => s.setId !== setId),
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="wk">
      <header className="wk-head">
        <Link to="/dashboard" aria-label="Go to dashboard">
          <img className="wk-logo" src={logo} alt="Rootine" />
        </Link>
        <span className="wk-pill">{lifetimeXp} XP</span>
      </header>

      <nav className="wk-nav">
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
        <header className="wk-sessionhead">
          <h1 className="wk-title">Training</h1>
          <div className="wk-sessionactions">
            {isActive ? (
              <>
                <span className="wk-chip">In progress</span>
                <button
                  type="button"
                  className="wk-btn wk-btn--ghost"
                  onClick={finishWorkout}
                  disabled={busy}
                >
                  Finish
                </button>
              </>
            ) : (
              <button
                type="button"
                className="wk-btn"
                onClick={startWorkout}
                disabled={busy}
              >
                Start workout
              </button>
            )}
          </div>
        </header>

        {error && (
          <p className="wk-error" role="alert">
            {error}
          </p>
        )}

        {isActive && (
          <>
            <div className="wk-stats">
              <div className="wk-stat">
                <b>{stats.count}</b>
                <span>Sets</span>
              </div>
              <div className="wk-stat">
                <b>{stats.volume}</b>
                <span>Vol (kg)</span>
              </div>
              <div className="wk-stat">
                <b>{stats.exercises}</b>
                <span>Exercises</span>
              </div>
            </div>

            <div className="wk-cols">
              <form className="wk-form" onSubmit={handleAddSet}>
                <h2 className="wk-h">Log set</h2>

                <label className="wk-field">
                  <span>Exercise</span>
                  <select
                    required
                    value={exercise}
                    onChange={(e) => setExercise(e.target.value)}
                    disabled={busy}
                  >
                    <option value="" disabled>
                      Select...
                    </option>
                    {EXERCISES.map((ex) => (
                      <option key={ex} value={ex}>
                        {ex}
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
                      required
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <label className="wk-field">
                    <span>Reps</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      disabled={busy}
                    />
                  </label>
                </div>

                <label className="wk-field">
                  <span>Weight (kg)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    disabled={busy}
                  />
                </label>

                <button
                  type="submit"
                  className="wk-btn"
                  disabled={busy || !exercise}
                >
                  Add
                </button>
              </form>

              <div>
                <h2 className="wk-h">Current session</h2>
                {activeWorkout.sets.length === 0 ? (
                  <p className="wk-empty-box">
                    No sets logged yet. Let's get moving.
                  </p>
                ) : (
                  <ul className="wk-list">
                    {activeWorkout.sets.map((s) => (
                      <li key={s.setId} className="wk-set">
                        <div>
                          <div className="wk-set-name">{s.exercise}</div>
                          <div className="wk-set-meta">
                            {s.sets} × {s.reps}{" "}
                            {s.weightKg ? `@ ${s.weightKg}kg` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="wk-link"
                          onClick={() => handleRemoveSet(s.setId)}
                        >
                          Delete
                        </button>
                        <Pips count={s.sets} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        {previous.length > 0 && (
          <div className="wk-prev">
            <h2 className="wk-h">Previous workouts</h2>
            <ul className="wk-tl">
              {previous.map((w) => (
                <li key={w.workoutId}>
                  <strong>{formatDateTime(w.endTime || w.startTime)}</strong>
                  <p>{w.sets.length} sets logged.</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <Chatbot />
    </div>
  );
}