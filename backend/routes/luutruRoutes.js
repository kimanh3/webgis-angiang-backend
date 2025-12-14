// backend/routes/luutruRoutes.js
const express = require("express");
const luutru = require("../controllers/luutruController");

// Public router: dùng cho bản đồ
const publicRouter = express.Router();

// Admin router: CRUD
const adminRouter = express.Router();

/**
 * =========================
 * PUBLIC (WebGIS Map)
 * Mount:
 *   app.use("/api/angiang", publicRouter)
 * => GET /api/angiang/luutru
 * =========================
 */
publicRouter.get("/luutru", luutru.getDiemLuuTruAG);

/**
 * =========================
 * ADMIN (CRUD)
 * Mount:
 *   app.use("/api/admin", adminRouter)
 * => CRUD:
 *   GET    /api/admin/luutru          (tạm dùng GeoJSON)
 *   GET    /api/admin/luutru/:gid
 *   POST   /api/admin/luutru
 *   PUT    /api/admin/luutru/:gid
 *   DELETE /api/admin/luutru/:gid
 * =========================
 */

// List cho Admin (tạm dùng lại GeoJSON)
adminRouter.get("/luutru", luutru.getDiemLuuTruAG);

// Lấy chi tiết 1 điểm lưu trú
adminRouter.get("/luutru/:gid", luutru.getDiemLuuTruById);

// Tạo mới điểm lưu trú
adminRouter.post("/luutru", luutru.createDiemLuuTru);

// Cập nhật điểm lưu trú
adminRouter.put("/luutru/:gid", luutru.updateDiemLuuTru);

// Xoá điểm lưu trú
adminRouter.delete("/luutru/:gid", luutru.deleteDiemLuuTru);

module.exports = { publicRouter, adminRouter };
