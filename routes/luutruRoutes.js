// backend/routes/luutruRoutes.js
const express = require("express");
const router = express.Router();
const luutru = require("../controllers/luutruController");

/**
 * ================== API PUBLIC (cho WebGIS bản đồ) ==================
 * GET /api/angiang/luutru
 * → Trả về GeoJSON FeatureCollection các điểm lưu trú
 */
router.get("/luutru", luutru.getDiemLuuTruAG);

/**
 * ================== API ADMIN (CRUD thật) ==================
 * Gợi ý: dùng prefix /api/admin/... khi mount router trong index.js
 *
 * - GET    /api/admin/luutru        → Lấy danh sách (dùng luôn GeoJSON hoặc sau này tách hàm riêng)
 * - GET    /api/admin/luutru/:gid   → Lấy chi tiết 1 điểm (cho form sửa)
 * - POST   /api/admin/luutru        → Thêm mới điểm lưu trú
 * - PUT    /api/admin/luutru/:gid   → Cập nhật điểm lưu trú
 * - DELETE /api/admin/luutru/:gid   → Xoá điểm lưu trú
 */

// List cho Admin (tạm dùng lại hàm GeoJSON, sau này cần bảng thì làm hàm riêng)
router.get("/admin/luutru", luutru.getDiemLuuTruAG);

// Lấy chi tiết 1 điểm lưu trú
router.get("/admin/luutru/:gid", luutru.getDiemLuuTruById);

// Tạo mới điểm lưu trú
router.post("/admin/luutru", luutru.createDiemLuuTru);

// Cập nhật điểm lưu trú
router.put("/admin/luutru/:gid", luutru.updateDiemLuuTru);

// Xoá điểm lưu trú
router.delete("/admin/luutru/:gid", luutru.deleteDiemLuuTru);

module.exports = router;
