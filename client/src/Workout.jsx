import { useEffect, useState } from "react";
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
import "./Workout.css";

const XP_PER_WORKOUT = 5;
const MILESTONE_WORKOUTS = 5; // completing this many workouts...
const MILESTONE_XP = 100; // ...earns a one-time bonus

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

function SetLine({ set }) {
  return (
    <span>
      {" "}
      {set.sets} × {set.reps}
      {set.weightKg != null ? ` @ ${set.weightKg} kg` : " · bodyweight"}
    </span>
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
      const completedCount =
        workouts.filter((w) => w.status === "COMPLETED").length + 1;
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
      } catch (err) {
        setError(`Workout saved, but XP wasn't awarded: ${err.message}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function logSet(e) {
    e.preventDefault();
    if (!activeWorkout) return setError("Start a workout first.");
    if (!exercise) return setError("Choose an exercise.");
    const setCount = Number(sets);
    const repCount = Number(reps);
    if (!setCount || !repCount) return setError("Sets and reps must be at least 1.");

    setError("");
    setBusy(true);
    try {
      const created = await createSet({
        workoutId: activeWorkout.workoutId,
        exercise,
        sets: setCount,
        reps: repCount,
        ...(weightKg !== "" && { weightKg: Number(weightKg) }),
      });
      updateActive((w) => ({ ...w, sets: [created, ...w.sets] }));
      setExercise("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteSet(setId) {
    setError("");
    try {
      await apiDeleteSet(setId);
      updateActive((w) => ({ ...w, sets: w.sets.filter((s) => s.setId !== setId) }));
    } catch (err) {
      setError(err.message);
    }
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
            <button
              type="button"
              className="wk-btn wk-btn--ghost"
              onClick={finishWorkout}
              disabled={busy}
            >
              Finish workout
            </button>
          ) : (
            <button type="button" className="wk-btn" onClick={startWorkout} disabled={busy}>
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
          <button type="submit" className="wk-btn" disabled={!isActive || busy}>
            Log sets
          </button>
        </form>

        <h2 className="wk-section">Today</h2>
        {!isActive || activeWorkout.sets.length === 0 ? (
          <p className="wk-empty">{emptyText}</p>
        ) : (
          <ul className="wk-list">
            {activeWorkout.sets.map((set) => (
              <li key={set.setId} className="wk-item">
                <div>
                  <strong>{set.exercise}</strong>
                  <SetLine set={set} />
                </div>
                <button type="button" className="wk-link" onClick={() => deleteSet(set.setId)}>
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