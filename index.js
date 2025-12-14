// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const app = express();

/* ===== Middlewares ===== */
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(compression());

// Log đơn giản
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

/* ===== Routes ===== */
// Admin (đăng nhập, sau này CRUD quản lý)
const adminRoutes       = require('./routes/adminRoutes');

// Các API WebGIS An Giang
const ranhgioiRoutes    = require('./routes/ranhgioiRoutes');
const dulichRoutes      = require('./routes/dulichRoutes');
const anuongRoutes      = require('./routes/anuongRoutes');
const muasamRoutes      = require('./routes/muasamRoutes');
const dichvuchungRoutes = require('./routes/dichvuchungRoutes');
const luutruRoutes      = require('./routes/luutruRoutes');

/** 
 * Prefix:
 *  - /api/admin/...  : cho đăng nhập & quản lý (AdminPage)
 *  - /api/angiang/...: cho WebGIS bản đồ
 */
app.use('/api', adminRoutes);             // /api/admin/login
app.use('/api/angiang', ranhgioiRoutes);  // /api/angiang/ranhgioi
app.use('/api/angiang', dulichRoutes);    // /api/angiang/dulich (+ CRUD nếu có)
app.use('/api/angiang', anuongRoutes);    // /api/angiang/anuong
app.use('/api/angiang', muasamRoutes);    // /api/angiang/muasam
app.use('/api/angiang', dichvuchungRoutes); // /api/angiang/dichvuchung
app.use('/api/angiang', luutruRoutes);    // /api/angiang/luutru

/* Healthcheck nhanh */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* 404 fallback */
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/* Error handler (tránh crash) */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

/* ===== Start server ===== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server chạy tại cổng ${PORT}`));
