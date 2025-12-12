// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");

/**
 * Đăng nhập Admin
 * POST /api/admin/login
 * Body: { username, password }
 */
router.post("/admin/login", admin.login);

module.exports = router;
