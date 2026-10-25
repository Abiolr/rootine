import { getUser } from "./api";

export const DAILY_TASK_XP = 20;

export const DAILY_TASKS = [
  { id: "pushups", label: "Do 5 push ups", exercise: "pushup", reps: 5 },
  { id: "squats", label: "Do 5 squats", exercise: "squat", reps: 5 },
  { id: "jumping-jacks", label: "Do 5 jumping jacks", exercise: "jumping_jack", reps: 5 },
];

export const WEEKLY_TASK = { label: "Workout 5 times", target: 5, xp: 100 };

// ---------- storage (per user, resets by local date / week) ----------
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Weeks start on Monday (local time)
function weekKey(d = new Date()) {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return dayKey(monday);
}

const storageKey = (name) => `rootine.${name}.${getUser().userId}`;

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function getDailyDone() {
  const saved = read(storageKey("daily"));
  return saved && saved.date === dayKey() ? saved.done : [];
}

export function completeDaily(id) {
  const done = getDailyDone();
  if (!done.includes(id)) done.push(id);
  write(storageKey("daily"), { date: dayKey(), done });
}

export function getWeekly() {
  const saved = read(storageKey("weekly"));
  return saved && saved.week === weekKey() ? saved : { week: weekKey(), count: 0, claimed: false };
}

// Call once per completed workout. justCompleted is true only the first time the target is hit.
export function incrementWeekly() {
  const week = getWeekly();
  const count = week.count + 1;
  const justCompleted = count >= WEEKLY_TASK.target && !week.claimed;
  write(storageKey("weekly"), {
    week: week.week,
    count,
    claimed: week.claimed || justCompleted,
  });
  return { count, justCompleted };
}