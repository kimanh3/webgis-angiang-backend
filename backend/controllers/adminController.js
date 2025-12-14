// backend/controllers/adminController.js
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "angiang-super-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

// ======================
// POST /api/admin/login
// ======================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ tài khoản và mật khẩu.",
        error: "MISSING_CREDENTIALS",
      });
    }

    const sql = `
      SELECT id, username, password_hash, full_name
      FROM public.admin_users
      WHERE username = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(sql, [username]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        message: "Sai tài khoản hoặc mật khẩu.",
        error: "INVALID_CREDENTIALS",
      });
    }

    const user = rows[0];

    // Hỗ trợ bcrypt hoặc plaintext (để tương thích dữ liệu hiện tại)
    let isValid = false;

    const hash = user.password_hash;
    if (typeof hash === "string" && hash.startsWith("$2")) {
      // bcrypt
      isValid = await bcrypt.compare(password, hash);
    } else {
      // plaintext (không khuyến khích)
      isValid = password === hash;
    }

    if (!isValid) {
      return res.status(401).json({
        message: "Sai tài khoản hoặc mật khẩu.",
        error: "INVALID_CREDENTIALS",
      });
    }

    // Token payload thống nhất + dễ mở rộng
    const token = jwt.sign(
      { id: user.id, username: user.username, role: "admin" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name || null,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);

    // Bắt lỗi hay gặp: chưa tạo bảng admin_users
    // Postgres: undefined_table = 42P01
    if (err && err.code === "42P01") {
      return res.status(500).json({
        message:
          "Thiếu bảng admin_users trong database. Vui lòng import SQL tạo bảng và dữ liệu admin.",
        error: "ADMIN_TABLE_NOT_FOUND",
        detail: err.message,
      });
    }

    return res.status(500).json({
      message: "Lỗi máy chủ khi đăng nhập.",
      error: "SERVER_ERROR",
      detail: err.message,
    });
  }
};

// ====================================
// Middleware kiểm tra token (ADMIN)
// Dùng cho: /api/admin/*
// ====================================
exports.requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Chưa đăng nhập.",
        error: "NO_TOKEN",
      });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);

    // Đồng bộ thông tin admin
    req.admin = {
      id: payload.id,
      username: payload.username,
      role: payload.role || "admin",
    };

    // ✅ QUAN TRỌNG: các controller CRUD đang đọc req.user?.id
    req.user = req.admin;

    return next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({
      message: "Phiên đăng nhập không hợp lệ.",
      error: "INVALID_TOKEN",
    });
  }
};
