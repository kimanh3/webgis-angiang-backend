// backend/routes/dulichRoutes.js
const express = require("express");
const dulich = require("../controllers/dulichController");

// Public router: dùng cho bản đồ
const publicRouter = express.Router();

// Admin router: CRUD
const adminRouter = express.Router();

/**
 * =========================
 * PUBLIC (WebGIS Map)
 * Mount:
 *   app.use("/api/angiang", publicRouter)
 * => GET /api/angiang/dulich
 * =========================
 */
publicRouter.get("/dulich", dulich.getDiaDiemDuLichAG);

/**
 * =========================
 * ADMIN (CRUD)
 * Mount:
 *   app.use("/api/admin", adminRouter)
 * => CRUD:
 *   GET    /api/admin/dulich
 *   GET    /api/admin/dulich/:gid
 *   POST   /api/admin/dulich
 *   PUT    /api/admin/dulich/:gid
 *   DELETE /api/admin/dulich/:gid
 * =========================
 */

// (Khuyến nghị) Bảo vệ route admin bằng token nếu bạn có requireAuth
try {
  const adminController = require("../controllers/adminController");
  if (adminController?.requireAuth) adminRouter.use(adminController.requireAuth);
} catch (_) {
  // nếu dự án bạn chưa có requireAuth thì bỏ qua để không crash
}

// List cho Admin
adminRouter.get("/dulich", dulich.getDiaDiemDuLichAG);

// Lấy chi tiết 1 điểm du lịch theo gid
adminRouter.get("/dulich/:gid", dulich.getDiemDuLichById);

// Tạo mới 1 điểm du lịch
adminRouter.post("/dulich", dulich.createDiemDuLich);

// Cập nhật 1 điểm du lịch
adminRouter.put("/dulich/:gid", dulich.updateDiemDuLich);

// Xoá 1 điểm du lịch
adminRouter.delete("/dulich/:gid", dulich.deleteDiemDuLich);

module.exports = { publicRouter, adminRouter };
