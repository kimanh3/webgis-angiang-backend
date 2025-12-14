// src/api/apiClient.js

const BASE_URL =
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE_URL) ||
  (typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL : "") ||
  "";

// Key token mới + cũ
const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_TOKEN_KEY_LEGACY = "admin_token";

// Kiểm tra token JWT dạng xxx.yyy.zzz
function isLikelyJwt(t) {
  if (!t || typeof t !== "string") return false;
  const s = t.trim().replace(/^"+|"+$/g, ""); // bỏ dấu " nếu bị dính
  return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(s);
}

function getCleanToken() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;

    let t =
      window.localStorage.getItem(ADMIN_TOKEN_KEY) ||
      window.localStorage.getItem(ADMIN_TOKEN_KEY_LEGACY);

    if (!t) return null;

    // trim + bỏ dấu quote nếu bị JSON stringify
    t = t.trim().replace(/^"+|"+$/g, "");

    // nếu token không đúng dạng JWT => xóa luôn để tránh jwt malformed lặp lại
    if (!isLikelyJwt(t)) {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.localStorage.removeItem(ADMIN_TOKEN_KEY_LEGACY);
      return null;
    }
    return t;
  } catch (_) {
    return null;
  }
}

async function request(path, options = {}) {
  const { method = "GET", data, headers: customHeaders = {} } = options;
  const headers = { ...customHeaders };

  // AUTO gắn token admin (nếu có) và token hợp lệ
  const token = getCleanToken();
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (data !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  const text = await res.text();

  if (!res.ok) {
    let message = `API ${method} ${path} failed (${res.status})`;
    try {
      const json = JSON.parse(text || "{}");
      message = json.message || json.error || message;
      if (json.detail) message = `${message} - ${json.detail}`;
    } catch (_) {
      if (text) message = `${message} - ${text}`;
    }
    throw new Error(message);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}

export const apiGet = (path, options) => request(path, { ...(options || {}), method: "GET" });
export const apiPost = (path, data, options) => request(path, { ...(options || {}), method: "POST", data });
export const apiPut = (path, data, options) => request(path, { ...(options || {}), method: "PUT", data });
export const apiDelete = (path, options) => request(path, { ...(options || {}), method: "DELETE" });

export default { apiGet, apiPost, apiPut, apiDelete };
