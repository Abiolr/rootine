import { stageForXp } from "./progression";

// Rootine API client. Set VITE_API_URL in .env (e.g. VITE_API_URL=http://localhost:3000)
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const TOKEN_KEY = "rootine.token";
const USER_KEY = "rootine.user";
const PROFILE_KEY = "rootine.profile";
const EQUIP_KEY = "rootine.equipped";

// ---------- safe storage helpers ----------
function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

// ---------- session ----------
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const getUser = () => read(USER_KEY, { userId: null, username: "Username" });

export function clearSession() {
  try {
    [TOKEN_KEY, USER_KEY, PROFILE_KEY, EQUIP_KEY].forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

// ---------- profile cache ----------
// The server is the source of truth. We cache what login, GET /me, PATCH /xp and /penalty return.
// Lifetime XP is never zeroed locally (Cosmetics unlock on it), only the status follows the penalties.
export const getProfile = () => {
  const p = read(PROFILE_KEY, { xp: 0, penalty_points: 0, status: null });
  return { ...p, status: stageForXp(p.xp, p.penalty_points) };
};

const saveProfile = (p) => write(PROFILE_KEY, p);

// Equipped cosmetic is not stored server-side.
export const getEquipped = () => read(EQUIP_KEY, "classic");
export const setEquipped = (id) => write(EQUIP_KEY, id);

// ---------- request helper ----------
async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Is the backend running?");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    // Expired or invalid token on a protected call: drop the session and go to login.
    if (auth && (res.status === 401 || res.status === 403)) {
      clearSession();
      window.location.assign("/login");
    }
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------- auth ----------
export const register = (username, password) =>
  request("/api/auth/register", { method: "POST", body: { username, password }, auth: false });

export async function login(username, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
  clearSession(); // don't leak the previous user's cached data
  localStorage.setItem(TOKEN_KEY, data.token);
  write(USER_KEY, { userId: data.userId, username: data.username });
  saveProfile({ xp: data.xp ?? 0, penalty_points: data.penalty_points ?? 0, status: data.status ?? null });
  return data;
}

export async function logout() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch {
    /* stateless JWT: always clear locally even if the call fails */
  }
  clearSession();
}

// ---------- users ----------
// Re-reads the saved profile from the server. Falls back to the cache if the call fails.
export async function refreshProfile() {
  try {
    const data = await request("/api/users/me");
    saveProfile({ xp: data.xp, penalty_points: data.penalty_points, status: data.status });
  } catch {
    /* offline or server down: keep showing the cached profile */
  }
  return getProfile();
}

export async function addXp(amount) {
  const data = await request("/api/users/xp", { method: "PATCH", body: { amount } });
  saveProfile({ xp: data.xp, penalty_points: data.penalty_points, status: data.status });
  return data;
}

export async function addPenalty(amount) {
  const data = await request("/api/users/penalty", { method: "PATCH", body: { amount } });
  saveProfile({ xp: data.xp, penalty_points: data.penalty_points, status: data.status });
  return data;
}

// ---------- workouts ----------
export const startWorkout = () => request("/api/workouts/start", { method: "POST" });
export const completeWorkout = (id) =>
  request(`/api/workouts/${id}/complete`, { method: "PATCH" });

// ---------- sets ----------
export const createSet = (set) => request("/api/sets", { method: "POST", body: set });
export const updateSet = (id, fields) =>
  request(`/api/sets/${id}`, { method: "PATCH", body: fields });
export const deleteSet = (id) => request(`/api/sets/${id}`, { method: "DELETE" });

// ---------- vision (separate CV service) ----------
// Set VITE_VISION_URL in .env, e.g. VITE_VISION_URL=https://rootine-vision-production.up.railway.app
const VISION_BASE =
  import.meta.env.VITE_VISION_URL ?? "https://rootine-vision-production.up.railway.app";

// Sends one JPEG data URL, returns 17 COCO keypoints [[x, y, conf], ...] (x/y normalized 0-1),
// or null when no person is detected.
export async function detectPose(image, exercise) {
  const res = await fetch(`${VISION_BASE}/api/vision/pose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, exercise }),
  });
  if (!res.ok) throw new Error(`Vision service error (${res.status})`);
  const data = await res.json();
  return data.keypoints?.[0] ?? null;
}

// ---------- coach ----------
export const chatWithCoach = (messages) => 
  request("/api/coach/chat", { method: "POST", body: { messages } });
