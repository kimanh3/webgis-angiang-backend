// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

/**
 * =========================
 * ADMIN AUTH ROUTES
 * Prefix mount ở index.js:
 *   app.use("/api/admin", adminRoutes);
 *
 * => Endpoint thực tế:
 *   POST /api/admin/login
 * =========================
 */

// POST /api/admin/login
router.post("/login", adminController.login);

module.exports = router;
