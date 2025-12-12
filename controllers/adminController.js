// backend/controllers/adminController.js
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "angiang-super-secret";

// POST /api/admin/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." });
    }

    const sql =
      "SELECT id, username, password_hash, full_name FROM public.admin_users WHERE username = $1";
    const { rows } = await pool.query(sql, [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu." });
    }

    const user = rows[0];

    // Nếu password_hash là bcrypt thì so sánh bằng bcrypt,
    // còn nếu bạn đang lưu plain text (vd: 'Ka@3421') thì so sánh trực tiếp.
    let isValid = false;
    if (user.password_hash && user.password_hash.startsWith("$2")) {
      // dạng hash bcrypt
      isValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // dạng plain text
      isValid = password === user.password_hash;
    }

    if (!isValid) {
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi đăng nhập." });
  }
};

// Middleware kiểm tra token cho các API quản lý
exports.requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Chưa đăng nhập." });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);

    // lưu thông tin admin vào req để dùng sau này nếu cần
    req.admin = {
      id: payload.id,
      username: payload.username,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ." });
  }
};
