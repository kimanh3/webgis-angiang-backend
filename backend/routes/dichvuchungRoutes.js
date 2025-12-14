// backend/routes/dichvuchungRoutes.js
const express = require("express");
const dv = require("../controllers/dichvuchungController");

// Public router: dùng cho bản đồ (không token)
const publicRouter = express.Router();

// Admin router: CRUD (nếu có auth middleware thì gắn vào đây)
const adminRouter = express.Router();

/**
 * =========================
 * PUBLIC (WebGIS Map)
 * Mount:
 *   app.use("/api/angiang", publicRouter)
 * => GET /api/angiang/dichvuchung
 * =========================
 */
publicRouter.get("/dichvuchung", dv.getDichVuChungAG);

/**
 * =========================
 * ADMIN (CRUD)
 * Mount:
 *   app.use("/api/admin", adminRouter)
 * => CRUD:
 *   GET    /api/admin/dichvuchung/:gid
 *   POST   /api/admin/dichvuchung
 *   PUT    /api/admin/dichvuchung/:gid
 *   DELETE /api/admin/dichvuchung/:gid
 * =========================
 */

// Lấy chi tiết 1 điểm dịch vụ chung
adminRouter.get("/dichvuchung/:gid", dv.getDichVuChungById);

// Tạo mới
adminRouter.post("/dichvuchung", dv.createDichVuChung);

// Cập nhật
adminRouter.put("/dichvuchung/:gid", dv.updateDichVuChung);

// Xoá
adminRouter.delete("/dichvuchung/:gid", dv.deleteDichVuChung);

module.exports = { publicRouter, adminRouter };
