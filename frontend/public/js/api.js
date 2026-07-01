// Shared client-side utilities for the chat app frontend.
// No build step - plain ES modules loaded directly by the browser.

const API_BASE = "/api";

export const auth = {
  getToken() {
    return localStorage.getItem("chatapp_token");
  },
  getUsername() {
    return localStorage.getItem("chatapp_username");
  },
  setSession(token, username) {
    localStorage.setItem("chatapp_token", token);
    localStorage.setItem("chatapp_username", username);
  },
  clearSession() {
    localStorage.removeItem("chatapp_token");
    localStorage.removeItem("chatapp_username");
  },
  requireAuth() {
    if (!this.getToken()) {
      window.location.href = "/login.html";
    }
  },
};

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = auth.getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      auth.clearSession();
      window.location.href = "/login.html";
    }
    throw new ApiError(body?.message || "Something went wrong", res.status, body);
  }

  return body;
}

export function apiGet(path) {
  return apiFetch(path, { method: "GET" });
}

export function apiPost(path, data) {
  return apiFetch(path, { method: "POST", body: JSON.stringify(data) });
}

export function apiPut(path, data) {
  return apiFetch(path, { method: "PUT", body: JSON.stringify(data) });
}

export function apiDelete(path) {
  return apiFetch(path, { method: "DELETE" });
}

export function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  return apiFetch("/images", { method: "POST", body: formData });
}

// ---- Toasts ----
let toastStack = null;
export function toast(message, type = "info") {
  if (!toastStack) {
    toastStack = document.createElement("div");
    toastStack.className = "toast-stack";
    document.body.appendChild(toastStack);
  }
  const el = document.createElement("div");
  el.className = `toast${type === "error" ? " error" : ""}`;
  el.textContent = message;
  toastStack.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ---- WebSocket connection (chat server) ----
// The server authenticates during the handshake itself (verifyClient reads
// ?authToken=... from the connection URL) - there is no in-band AUTH
// message, so the token must be on the URL before the socket opens.
export function connectChatSocket() {
  const token = auth.getToken();
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  const wsHost = window.location.hostname;
  return new WebSocket(`${wsProtocol}://${wsHost}:4000?authToken=${encodeURIComponent(token)}`);
}

export function initials(name) {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
