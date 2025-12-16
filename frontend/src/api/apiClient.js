// frontend/src/api/apiClient.js
// ✅ Render static site: luôn gọi thẳng backend (không dùng setupProxy)

const BASE_URL = "https://webgis-angiang-backend-2.onrender.com"; // ✅ cố định

const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_TOKEN_KEY_LEGACY = "admin_token";

// ---- helpers ----
function isLikelyJwt(t) {
  if (!t || typeof t !== "string") return false;
  const s = t.trim().replace(/^"+|"+$/g, "");
  return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(s);
}

function getCleanToken() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;

    let t =
      window.localStorage.getItem(ADMIN_TOKEN_KEY) ||
      window.localStorage.getItem(ADMIN_TOKEN_KEY_LEGACY);

    if (!t) return null;

    t = t.trim().replace(/^"+|"+$/g, "");

    if (!isLikelyJwt(t)) {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.localStorage.removeItem(ADMIN_TOKEN_KEY_LEGACY);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

function buildUrl(path = "") {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return BASE_URL.replace(/\/+$/, "") + p;
}

async function request(path, options = {}) {
  const { method = "GET", data, headers: customHeaders = {}, timeoutMs = 30000 } = options;

  const url = buildUrl(path);
  const headers = { ...customHeaders };

  const token = getCleanToken();
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (data !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  let text = "";
  try {
    res = await fetch(url, {
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
      signal: controller.signal,
      // credentials: "include", // chỉ bật nếu backend dùng cookie
    });
    text = await res.text();
  } catch (e) {
    clearTimeout(timer);
    const msg = e?.name === "AbortError" ? `Timeout ${timeoutMs}ms` : (e?.message || "Network error");
    throw new Error(`API ${method} ${url} failed - ${msg}`);
  } finally {
    clearTimeout(timer);
  }

  // Nếu bị rewrite trả về index.html (HTML) -> báo rõ
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const looksLikeHtml = ct.includes("text/html") || /^\s*</.test(text); // bắt trường hợp HTML
  if (looksLikeHtml) {
    // thường do FE gọi nhầm domain FE hoặc rule rewrite ăn vào /api
    throw new Error(
      `API ${method} ${url} returned HTML (likely rewrite to index.html). Check backend URL / Render rewrites.`
    );
  }

  if (!res.ok) {
    let message = `API ${method} ${url} failed (${res.status})`;
    try {
      const json = JSON.parse(text || "{}");
      message = json.message || json.error || message;
      if (json.detail) message = `${message} - ${json.detail}`;
    } catch {
      if (text) message = `${message} - ${text}`;
    }
    throw new Error(message);
  }

  if (!text) return null;

  // Ưu tiên JSON
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---- exported helpers ----
export const apiGet = (path, options) =>
  request(path, { ...(options || {}), method: "GET" });

export const apiPost = (path, data, options) =>
  request(path, { ...(options || {}), method: "POST", data });

export const apiPut = (path, data, options) =>
  request(path, { ...(options || {}), method: "PUT", data });

export const apiDelete = (path, options) =>
  request(path, { ...(options || {}), method: "DELETE" });

const apiClient = { apiGet, apiPost, apiPut, apiDelete };
export default apiClient;
