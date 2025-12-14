// backend/routes/anuongRoutes.js
const express = require("express");
const anuongController = require("../controllers/anuongController");

// Public router: dùng cho bản đồ (không token)
const publicRouter = express.Router();

// Admin router: CRUD (có token)
const adminRouter = express.Router();

/**
 * =========================
 * PUBLIC (WebGIS Map)
 * Mount:
 *   app.use("/api/angiang", publicRouter)
 * => GET /api/angiang/anuong
 * =========================
 */
publicRouter.get("/anuong", anuongController.getDiaDiemAnUongAG);

/**
 * =========================
 * ADMIN (CRUD)
 * Mount:
 *   app.use("/api/admin", adminRouter)
 * => CRUD:
 *   GET    /api/admin/anuong
 *   GET    /api/admin/anuong/:gid
 *   POST   /api/admin/anuong
 *   PUT    /api/admin/anuong/:gid
 *   DELETE /api/admin/anuong/:gid
 * =========================
 */

// (Khuyến nghị) Bảo vệ route admin bằng token nếu bạn có requireAuth
try {
  const adminController = require("../controllers/adminController");
  if (adminController?.requireAuth) adminRouter.use(adminController.requireAuth);
} catch (_) {
  // nếu dự án bạn chưa có requireAuth thì bỏ qua để không crash
}

// ✅ List cho Admin (để tab quản trị load danh sách)
adminRouter.get("/anuong", anuongController.getDiaDiemAnUongAG);

// ✅ Lấy chi tiết 1 điểm (cho form sửa)
adminRouter.get("/anuong/:gid", anuongController.getDiaDiemAnUongById);

// ✅ Tạo mới
adminRouter.post("/anuong", anuongController.createDiaDiemAnUong);

// ✅ Cập nhật
adminRouter.put("/anuong/:gid", anuongController.updateDiaDiemAnUong);

// ✅ Xoá
adminRouter.delete("/anuong/:gid", anuongController.deleteDiaDiemAnUong);

module.exports = { publicRouter, adminRouter };
