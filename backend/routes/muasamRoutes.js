// backend/routes/muasamRoutes.js
const express = require("express");
const muasam = require("../controllers/muasamController");

// Public router: dùng cho bản đồ
const publicRouter = express.Router();

// Admin router: CRUD
const adminRouter = express.Router();

/**
 * =========================
 * PUBLIC (WebGIS Map)
 * Mount:
 *   app.use("/api/angiang", publicRouter)
 * => GET /api/angiang/muasam
 * =========================
 */
publicRouter.get("/muasam", muasam.getDiaDiemMuaSamAG);

/**
 * =========================
 * ADMIN (CRUD)
 * Mount:
 *   app.use("/api/admin", adminRouter)
 * => CRUD:
 *   GET    /api/admin/muasam
 *   GET    /api/admin/muasam/:gid
 *   POST   /api/admin/muasam
 *   PUT    /api/admin/muasam/:gid
 *   DELETE /api/admin/muasam/:gid
 * =========================
 */

// List cho Admin (tạm dùng lại GeoJSON)
adminRouter.get("/muasam", muasam.getDiaDiemMuaSamAG);

// Lấy chi tiết 1 điểm mua sắm theo gid
adminRouter.get("/muasam/:gid", muasam.getDiaDiemMuaSamById);

// Tạo mới điểm mua sắm
adminRouter.post("/muasam", muasam.createDiaDiemMuaSam);

// Cập nhật điểm mua sắm
adminRouter.put("/muasam/:gid", muasam.updateDiaDiemMuaSam);

// Xoá điểm mua sắm
adminRouter.delete("/muasam/:gid", muasam.deleteDiaDiemMuaSam);

module.exports = { publicRouter, adminRouter };
