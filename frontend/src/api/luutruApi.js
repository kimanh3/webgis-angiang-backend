// src/api/luutruApi.js
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { adminAuth } from "./adminApi";

/* ===========================================
   ĐƯỜNG DẪN API (ĐỒNG NHẤT BACKEND)
=========================================== */

// API dùng cho WebGIS (public)
// GET /api/angiang/luutru
export const LUUTRU_PATH = "/api/angiang/luutru";

// API CRUD dành cho trang Admin (có token)
// GET    /api/admin/luutru/:gid
// POST   /api/admin/luutru
// PUT    /api/admin/luutru/:gid
// DELETE /api/admin/luutru/:gid
export const LUUTRU_ADMIN_PATH = "/api/admin/luutru";

/* ===========================================
   ĐỐI TƯỢNG API CHUẨN HOÁ
=========================================== */

export const luutruApi = {
  // ===== Lấy tất cả cho bản đồ – GeoJSON =====
  getAll(options = {}) {
    return apiGet(LUUTRU_PATH, options);
  },

  // ===== Lấy chi tiết theo gid (CRUD Admin) =====
  getById(gid, options = {}) {
    if (!gid) throw new Error("gid là bắt buộc");
    const token = adminAuth.getToken();
    return apiGet(`${LUUTRU_ADMIN_PATH}/${gid}`, { ...options, token });
  },

  // ===== Tạo mới (CRUD Admin) =====
  create(data, options = {}) {
    const token = adminAuth.getToken();
    return apiPost(LUUTRU_ADMIN_PATH, data, { ...options, token });
  },

  // ===== Cập nhật (CRUD Admin) =====
  update(gid, data, options = {}) {
    if (!gid) throw new Error("gid là bắt buộc");
    const token = adminAuth.getToken();
    return apiPut(`${LUUTRU_ADMIN_PATH}/${gid}`, data, { ...options, token });
  },

  // ===== Xoá (CRUD Admin) =====
  remove(gid, options = {}) {
    if (!gid) throw new Error("gid là bắt buộc");
    const token = adminAuth.getToken();
    return apiDelete(`${LUUTRU_ADMIN_PATH}/${gid}`, { ...options, token });
  },
};

/* ===========================================
   HÀM TIỆN LỢI — DÙNG TRONG COMPONENT
=========================================== */

export const listLuuTru = (options) => luutruApi.getAll(options);

export const getLuuTruById = (gid, options) => luutruApi.getById(gid, options);

export const createLuuTru = (data, options) => luutruApi.create(data, options);

export const updateLuuTru = (gid, data, options) =>
  luutruApi.update(gid, data, options);

export const deleteLuuTru = (gid, options) => luutruApi.remove(gid, options);

/* ===========================================
   EXPORT DEFAULT
=========================================== */
export default luutruApi;
