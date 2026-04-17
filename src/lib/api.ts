export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://127.0.0.1:5000";

// ------------------------------------------------------------------
// JWT token management — stored in sessionStorage so it is:
//   - cleared when the browser tab/session closes
//   - not persisted in localStorage across independent sessions
// ------------------------------------------------------------------

const TOKEN_KEY = "moduserv:token";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Drop-in replacement for `fetch()` that automatically injects the
 * Authorization header when a JWT token is present in sessionStorage.
 * Falls back to a plain unauthenticated request when no token exists
 * (offline-first: the app still works without a live backend).
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers as HeadersInit | undefined);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...options, headers });
}
