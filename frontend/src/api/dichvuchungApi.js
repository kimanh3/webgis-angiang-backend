// src/api/dichvuchungApi.js
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { adminAuth } from "./adminApi";

/* ===========================================
   ĐƯỜNG DẪN API (ĐỒNG NHẤT BACKEND)
=========================================== */

// API để hiển thị trên bản đồ (không cần xác thực)
// GET /api/angiang/dichvuchung
export const DICHVUCHUNG_PATH = "/api/angiang/dichvuchung";

// API dành cho trang Admin CRUD (có xác thực)
// GET    /api/admin/dichvuchung/:gid
// POST   /api/admin/dichvuchung
// PUT    /api/admin/dichvuchung/:gid
// DELETE /api/admin/dichvuchung/:gid
export const DICHVUCHUNG_ADMIN_PATH = "/api/admin/dichvuchung";

/* ===========================================
   ĐỐI TƯỢNG API CHUẨN HOÁ
=========================================== */

export const dichvuchungApi = {
  // ======= Lấy danh sách để hiển thị trên WebGIS (GeoJSON) =======
  getAll(options = {}) {
    return apiGet(DICHVUCHUNG_PATH, options);
  },

  // ======= Lấy chi tiết 1 bản ghi (ADMIN) =======
  getById(gid, options = {}) {
    if (!gid) throw new Error("gid là bắt buộc");
    const token = adminAuth.getToken();
    return apiGet(`${DICHVUCHUNG_ADMIN_PATH}/${gid}`, { ...options, token });
  },

  // ======= Thêm bản ghi mới (ADMIN) =======
  create(data, options = {}) {
    const token = adminAuth.getToken();
    return apiPost(DICHVUCHUNG_ADMIN_PATH, data, { ...options, token });
  },

  // ======= Cập nhật bản ghi (ADMIN) =======
  update(gid, data, options = {}) {
    if (!gid) throw new Error("gid là bắt buộc");
    const token = adminAuth.getToken();
    return apiPut(`${DICHVUCHUNG_ADMIN_PATH}/${gid}`, data, { ...options, token });
  },

  // ======= Xoá bản ghi (ADMIN) =======
  remove(gid, options = {}) {
    if (!gid) throw new Error("gid là bắt buộc");
    const token = adminAuth.getToken();
    return apiDelete(`${DICHVUCHUNG_ADMIN_PATH}/${gid}`, { ...options, token });
  },
};

/* ===========================================
   EXPORT HÀM THUẬN TIỆN – DÙNG TRONG PAGE
=========================================== */

// List để MapComponent, TrangTraCuu sử dụng
export const listDichVuChung = (options) => dichvuchungApi.getAll(options);

// Get single record trong CRUD admin
export const getDichVuChungById = (gid, options) => dichvuchungApi.getById(gid, options);

// CRUD Admin
export const createDichVuChung = (data, options) => dichvuchungApi.create(data, options);
export const updateDichVuChung = (gid, data, options) => dichvuchungApi.update(gid, data, options);
export const deleteDichVuChung = (gid, options) => dichvuchungApi.remove(gid, options);

/* ===========================================
   EXPORT DEFAULT
=========================================== */
export default dichvuchungApi;
