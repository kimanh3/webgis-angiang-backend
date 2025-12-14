// src/api/ranhgioiApi.js
import { apiGet } from "./apiClient";

/* ===========================================
   ĐƯỜNG DẪN API (ĐÚNG BACKEND)
=========================================== */

// API dùng cho WebGIS – trả GeoJSON FeatureCollection
// GET /api/angiang/ranhgioi
export const RANHGIOI_PATH = "/api/angiang/ranhgioi";

/* ===========================================
   API OBJECT
=========================================== */

export const ranhgioiApi = {
  /**
   * Lấy toàn bộ ranh giới hành chính (xã) tỉnh An Giang
   * - Dùng cho MapComponent
   * - Không cần token
   */
  getAll(options = {}) {
    return apiGet(RANHGIOI_PATH, options);
  },
};

/* ===========================================
   HÀM TIỆN DÙNG CHO COMPONENT
=========================================== */

export const listRanhGioi = (options) => ranhgioiApi.getAll(options);

/* ===========================================
   EXPORT DEFAULT
=========================================== */
export default ranhgioiApi;
