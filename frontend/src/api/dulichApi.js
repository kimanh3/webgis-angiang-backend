// src/api/dulichApi.js
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { adminAuth } from "./adminApi";

/* ===========================================
   ĐƯỜNG DẪN API (ĐỒNG NHẤT BACKEND)
=========================================== */

// Public (bản đồ)
export const DULICH_PATH = "/api/angiang/dulich";

// Admin CRUD
export const DULICH_ADMIN_PATH = "/api/admin/dulich";

/* ===========================================
   HELPER
=========================================== */
const requireGid = (gid) => {
  // ✅ gid hợp lệ nếu khác null/undefined
  if (gid == null) throw new Error("gid là bắt buộc");
  return gid;
};

const getAdminToken = () => {
  // nếu chưa login thì vẫn gửi null để apiClient tự xử lý/throw
  return adminAuth?.getToken?.() || null;
};

/* ===========================================
   API CHUẨN HOÁ
=========================================== */

export const dulichApi = {
  // ===== GeoJSON public =====
  getAll(options = {}) {
    return apiGet(DULICH_PATH, options);
  },

  // ===== Admin: get by gid =====
  getById(gid, options = {}) {
    requireGid(gid);
    const token = getAdminToken();
    return apiGet(`${DULICH_ADMIN_PATH}/${gid}`, { ...options, token });
  },

  // ===== Admin: create =====
  create(data, options = {}) {
    const token = getAdminToken();
    return apiPost(DULICH_ADMIN_PATH, data, { ...options, token });
  },

  // ===== Admin: update =====
  update(gid, data, options = {}) {
    requireGid(gid);
    const token = getAdminToken();
    return apiPut(`${DULICH_ADMIN_PATH}/${gid}`, data, { ...options, token });
  },

  // ===== Admin: delete =====
  remove(gid, options = {}) {
    requireGid(gid);
    const token = getAdminToken();
    return apiDelete(`${DULICH_ADMIN_PATH}/${gid}`, { ...options, token });
  },
};

/* ===========================================
   EXPORT TIỆN LỢI — DÙNG TRONG COMPONENT
=========================================== */

export const listDuLich = (options) => dulichApi.getAll(options);

export const getDuLichById = (gid, options) => dulichApi.getById(gid, options);
export const createDuLich = (data, options) => dulichApi.create(data, options);
export const updateDuLich = (gid, data, options) =>
  dulichApi.update(gid, data, options);
export const deleteDuLich = (gid, options) => dulichApi.remove(gid, options);

export default dulichApi;
