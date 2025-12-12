// backend/routes/dichvuchungRoutes.js
const express = require("express");
const router = express.Router();
const dv = require("../controllers/dichvuchungController");

// ====== API PUBLIC CHO WEBGIS (GeoJSON) ======
// GET /api/angiang/dichvuchung
router.get("/dichvuchung", dv.getDichVuChungAG);

// ====== NHÓM API QUẢN LÝ (ADMIN CRUD THẬT) ======
// Lấy chi tiết 1 điểm dịch vụ chung
// GET /api/angiang/admin/dichvuchung/:gid
router.get("/admin/dichvuchung/:gid", dv.getDichVuChungById);

// Tạo mới điểm dịch vụ chung
// POST /api/angiang/admin/dichvuchung
router.post("/admin/dichvuchung", dv.createDichVuChung);

// Cập nhật điểm dịch vụ chung
// PUT /api/angiang/admin/dichvuchung/:gid
router.put("/admin/dichvuchung/:gid", dv.updateDichVuChung);

// Xoá điểm dịch vụ chung
// DELETE /api/angiang/admin/dichvuchung/:gid
router.delete("/admin/dichvuchung/:gid", dv.deleteDichVuChung);

module.exports = router;
