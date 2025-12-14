// src/api/adminApi.js
import { apiPost } from "./apiClient";

/** Endpoint đăng nhập admin (backend Express) */
export const ADMIN_LOGIN_PATH = "/api/admin/login";

/**
 * Key lưu token admin trong localStorage
 * - adminToken: key mới (camelCase)
 * - admin_token: key cũ (snake_case) để tương thích các component/guard đang dùng
 */
export const ADMIN_TOKEN_KEY = "adminToken";
export const ADMIN_TOKEN_KEY_LEGACY = "admin_token";

/** Key lưu info admin user (tuỳ chọn) */
export const ADMIN_USER_KEY = "adminUser";
export const ADMIN_USER_KEY_LEGACY = "admin_user";

/** Event để các component lắng nghe thay đổi đăng nhập */
export const ADMIN_AUTH_EVENT = "admin-login-change";

/** Helper parse JSON an toàn */
function safeJsonParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (_e) {
    return null;
  }
}

/** Chuẩn hóa lỗi trả về từ backend/apiClient */
function normalizeAuthError(errOrRes) {
  // Nếu apiClient throw Error
  if (errOrRes instanceof Error) {
    return { message: errOrRes.message || "Đăng nhập thất bại", raw: errOrRes };
  }
  // Nếu backend trả {message, error}
  if (errOrRes && typeof errOrRes === "object") {
    return {
      message: errOrRes.message || errOrRes.error || "Đăng nhập thất bại",
      raw: errOrRes,
    };
  }
  return { message: "Đăng nhập thất bại", raw: errOrRes };
}

/** Các hàm tiện ích xử lý token đăng nhập admin */
export const adminAuth = {
  /** Lưu token sau khi đăng nhập thành công */
  saveToken(token) {
    if (!token) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        // lưu cả key mới + key cũ để đồng bộ toàn dự án
        window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
        window.localStorage.setItem(ADMIN_TOKEN_KEY_LEGACY, token);
        window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
      }
    } catch (e) {
      console.warn("Không thể lưu token admin:", e);
    }
  },

  /** Lưu thông tin user (tuỳ chọn) */
  saveUser(user) {
    if (!user) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const payload = JSON.stringify(user);
        window.localStorage.setItem(ADMIN_USER_KEY, payload);
        window.localStorage.setItem(ADMIN_USER_KEY_LEGACY, payload);
        window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
      }
    } catch (e) {
      console.warn("Không thể lưu admin user:", e);
    }
  },

  /** Lấy token hiện tại (ưu tiên key mới, fallback key cũ) */
  getToken() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return (
          window.localStorage.getItem(ADMIN_TOKEN_KEY) ||
          window.localStorage.getItem(ADMIN_TOKEN_KEY_LEGACY)
        );
      }
      return null;
    } catch (e) {
      console.warn("Không thể đọc token admin:", e);
      return null;
    }
  },

  /** Lấy admin user (ưu tiên key mới, fallback key cũ) */
  getUser() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw =
          window.localStorage.getItem(ADMIN_USER_KEY) ||
          window.localStorage.getItem(ADMIN_USER_KEY_LEGACY);
        return safeJsonParse(raw);
      }
      return null;
    } catch (e) {
      console.warn("Không thể đọc admin user:", e);
      return null;
    }
  },

  /** Xoá token/user khi đăng xuất */
  clearToken() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        window.localStorage.removeItem(ADMIN_TOKEN_KEY_LEGACY);
        window.localStorage.removeItem(ADMIN_USER_KEY);
        window.localStorage.removeItem(ADMIN_USER_KEY_LEGACY);
        window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
      }
    } catch (e) {
      console.warn("Không thể xoá token admin:", e);
    }
  },

  logout() {
    this.clearToken();
  },

  isLoggedIn() {
    return !!this.getToken();
  },
};

/** Gọi API đăng nhập admin */
export const adminApi = {
  /**
   * credentials: { username, password }
   * Backend trả: { token, user: { id, username, fullName, role? } }
   */
  async login(credentials, options) {
    try {
      const res = await apiPost(ADMIN_LOGIN_PATH, credentials, options);

      // validate response
      if (!res?.token) {
        const norm = normalizeAuthError(res);
        throw new Error(norm.message);
      }

      // Đồng bộ toàn hệ thống
      adminAuth.saveToken(res.token);
      if (res?.user) adminAuth.saveUser(res.user);

      return res;
    } catch (e) {
      const norm = normalizeAuthError(e);
      // ném lỗi để UI hiển thị message rõ
      throw new Error(norm.message);
    }
  },
};

/** Alias cho component */
export const adminLogin = (credentials, options) =>
  adminApi.login(credentials, options);
