// TEMP
const USE_MOCK_AUTH = true;

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
if (!USE_MOCK_AUTH && !BASE) console.warn("VITE_API_URL is not set, so requests will go to this app's own server. Add it to client/.env and restart the dev server.");

const TOKEN_KEY = "token";
const MOCK_USER_KEY = "mock_username";
const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms)); // fake network delay so loading states are visible

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(MOCK_USER_KEY);
};

// Sends a request and returns the parsed JSON
async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${getToken()}`;

  const url = `${BASE}${path}`;
  let res;
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({})); // for responses the have no JSON body
  if (!res.ok) {
    const fallback = res.status === 404 ? `Not found: ${method} ${url}. Check VITE_API_URL in client/.env.` : `Something went wrong (${res.status}).`;
    const err = new Error(data.message || data.error || fallback);
    err.status = res.status;
    throw err;
  }
  return data;
}

// api/auth/register: creates the account, but does not log in
export async function register(username, password) {
  if (USE_MOCK_AUTH) {
    await wait();
    return { message: "User registered successfully" };
  }
  return request("/api/auth/register", { method: "POST", body: { username, password } });
}

// api/auth/login: saves the returned JWT so later calls can use it
export async function login(username, password) {
  if (USE_MOCK_AUTH) {
    await wait();
    localStorage.setItem(TOKEN_KEY, "mock-token");
    localStorage.setItem(MOCK_USER_KEY, username);
    return { token: "mock-token", username };
  }
  const data = await request("/api/auth/login", { method: "POST", body: { username, password } });
  if (!data.token) throw new Error("Login worked but the server sent no token.");
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

// api/auth/logout: deletes the token
export async function logout() {
  try {
    if (!USE_MOCK_AUTH) await request("/api/auth/logout", { method: "POST", auth: true });
  } catch {
    // ignore: the user is logged out on this device either way
  } finally {
    clearToken();
  }
}

// api/auth/me: returns the logged-in user's data from the token
export async function getMe() {
  if (USE_MOCK_AUTH) {
    await wait(100);
    return { user: { username: localStorage.getItem(MOCK_USER_KEY) || "test" } };
  }
  return request("/api/auth/me", { auth: true });
}
