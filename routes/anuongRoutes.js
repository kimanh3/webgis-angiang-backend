// backend/routes/anuongRoutes.js
const express = require("express");
const router = express.Router();
const anuongController = require("../controllers/anuongController");

// ================== API ĂN UỐNG (AN GIANG) ==================

// Lấy toàn bộ điểm ăn uống dạng GeoJSON
// GET /api/angiang/anuong
router.get("/anuong", anuongController.getDiaDiemAnUongAG);

// Lấy chi tiết 1 điểm ăn uống theo gid (dùng cho form sửa)
// GET /api/angiang/anuong/:gid
router.get("/anuong/:gid", anuongController.getDiaDiemAnUongById);

// Tạo mới điểm ăn uống
// POST /api/angiang/anuong
router.post("/anuong", anuongController.createDiaDiemAnUong);

// Cập nhật điểm ăn uống
// PUT /api/angiang/anuong/:gid
router.put("/anuong/:gid", anuongController.updateDiaDiemAnUong);

// Xoá điểm ăn uống
// DELETE /api/angiang/anuong/:gid
router.delete("/anuong/:gid", anuongController.deleteDiaDiemAnUong);

module.exports = router;
