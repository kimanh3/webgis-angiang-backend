// src/api/muasamApi.js
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { adminAuth } from "./adminApi";

/* ===========================================
   ĐƯỜNG DẪN API (ĐỒNG NHẤT BACKEND)
=========================================== */

// API cho WebGIS (hiển thị bản đồ) – không cần token
// GET /api/angiang/muasam
export const MUASAM_PATH = "/api/angiang/muasam";

// API CRUD dành cho trang quản trị (có token)
// GET    /api/admin/muasam/:gid
// POST   /api/admin/muasam
// PUT    /api/admin/muasam/:gid
// DELETE /api/admin/muasam/:gid
export const MUASAM_ADMIN_PATH = "/api/admin/muasam";

/* ===========================================
   API OBJECT CHUẨN HÓA
=========================================== */

export const muasamApi = {
  // ====== Lấy toàn bộ (WebGIS) – trả FeatureCollection ======
  getAll(options = {}) {
    return apiGet(MUASAM_PATH, options);
  },

  // ====== Lấy chi tiết theo gid (CRUD Admin) ======
  getById(gid, options = {}) {
    if (!gid) throw new Error("gid là bắt buộc");
    const token = adminAuth.getToken();
    return apiGet(`${MUASAM_ADMIN_PATH}/${gid}`, { ...options, token });
  },

  // ====== Tạo mới (CRUD Admin) ======
  create(data, options = {}) {
    const token = adminAuth.getToken();
    return apiPost(MUASAM_ADMIN_PATH, data, { ...options, token });
  },

  // ====== Cập nhật (CRUD Admin) ======
  update(gid, data, options = {}) {
    if (!gid) throw new Error("gid là bắt buộc");
    const token = adminAuth.getToken();
    return apiPut(`${MUASAM_ADMIN_PATH}/${gid}`, data, { ...options, token });
  },

  // ====== Xoá (CRUD Admin) ======
  remove(gid, options = {}) {
    if (!gid) throw new Error("gid là bắt buộc");
    const token = adminAuth.getToken();
    return apiDelete(`${MUASAM_ADMIN_PATH}/${gid}`, { ...options, token });
  },
};

/* ===========================================
   HÀM ALIAS TIỆN DÙNG CHO COMPONENT
=========================================== */

export const listMuaSam = (options) => muasamApi.getAll(options);
export const getMuaSamById = (gid, options) => muasamApi.getById(gid, options);
export const createMuaSam = (data, options) => muasamApi.create(data, options);
export const updateMuaSam = (gid, data, options) =>
  muasamApi.update(gid, data, options);
export const deleteMuaSam = (gid, options) =>
  muasamApi.remove(gid, options);

/* ===========================================
   EXPORT DEFAULT
=========================================== */
export default muasamApi;
