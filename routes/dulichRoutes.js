// backend/routes/dulichRoutes.js
const express = require("express");
const router = express.Router();
const dulich = require("../controllers/dulichController");

/* ========== API PUBLIC CHO BẢN ĐỒ ========== */
/**
 * GET /api/angiang/dulich
 * Trả về GeoJSON các điểm du lịch cho WebGIS
 */
router.get("/dulich", dulich.getDiaDiemDuLichAG);

/* ========== API ADMIN (CRUD THẬT) ========== */
/**
 * Sau này bạn có thể gắn middleware auth trước các route admin, ví dụ:
 * router.use("/admin", require("../middlewares/authAdmin"));
 */

/**
 * GET /api/angiang/admin/dulich/:gid
 * Lấy chi tiết 1 điểm du lịch theo gid
 */
router.get("/admin/dulich/:gid", dulich.getDiemDuLichById);

/**
 * POST /api/angiang/admin/dulich
 * Tạo mới 1 điểm du lịch
 */
router.post("/admin/dulich", dulich.createDiemDuLich);

/**
 * PUT /api/angiang/admin/dulich/:gid
 * Cập nhật 1 điểm du lịch
 */
router.put("/admin/dulich/:gid", dulich.updateDiemDuLich);

/**
 * DELETE /api/angiang/admin/dulich/:gid
 * Xoá 1 điểm du lịch
 */
router.delete("/admin/dulich/:gid", dulich.deleteDiemDuLich);

module.exports = router;
