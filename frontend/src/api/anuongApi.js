// src/api/anuongApi.js
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

/**
 * ==============================
 * API ĂN UỐNG – AN GIANG
 * ==============================
 *
 * - Public (Map/Tra cứu):
 *   GET    /api/angiang/anuong
 *
 * - Admin CRUD (requireAuth):
 *   GET    /api/admin/anuong/:gid
 *   POST   /api/admin/anuong
 *   PUT    /api/admin/anuong/:gid
 *   DELETE /api/admin/anuong/:gid
 *
 * Ghi chú:
 * - Token admin sẽ được apiClient.js tự gắn vào header Authorization từ localStorage (adminToken).
 */

export const ANUONG_PUBLIC_PATH = "/api/angiang/anuong";
export const ANUONG_ADMIN_PATH = "/api/admin/anuong";

export const anuongApi = {
  /** Lấy toàn bộ điểm ăn uống (GeoJSON FeatureCollection) */
  getAll(options = {}) {
    return apiGet(ANUONG_PUBLIC_PATH, options);
  },

  /** Lấy chi tiết 1 điểm (ADMIN) - dùng cho form Sửa */
  getById(gid, options = {}) {
    if (gid === undefined || gid === null || gid === "") {
      throw new Error("gid là bắt buộc");
    }
    return apiGet(`${ANUONG_ADMIN_PATH}/${gid}`, options);
  },

  /** Thêm mới (ADMIN) */
  create(data, options = {}) {
    return apiPost(ANUONG_ADMIN_PATH, data, options);
  },

  /** Cập nhật (ADMIN) */
  update(gid, data, options = {}) {
    if (gid === undefined || gid === null || gid === "") {
      throw new Error("gid là bắt buộc");
    }
    return apiPut(`${ANUONG_ADMIN_PATH}/${gid}`, data, options);
  },

  /** Xoá (ADMIN) */
  remove(gid, options = {}) {
    if (gid === undefined || gid === null || gid === "") {
      throw new Error("gid là bắt buộc");
    }
    return apiDelete(`${ANUONG_ADMIN_PATH}/${gid}`, options);
  },
};

/** Export các hàm thuận tiện cho component */
export const listAmThuc = (options) => anuongApi.getAll(options);
export const getAmThucById = (gid, options) => anuongApi.getById(gid, options);
export const createAmThuc = (data, options) => anuongApi.create(data, options);
export const updateAmThuc = (gid, data, options) =>
  anuongApi.update(gid, data, options);
export const deleteAmThuc = (gid, options) => anuongApi.remove(gid, options);

export default anuongApi;
