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