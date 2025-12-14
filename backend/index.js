// backend/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const compression = require("compression");

// ✅ Import pool DB (để khởi tạo + dùng /api/db-check)
const pool = require("./db");

const app = express();

// Render/Proxy (để lấy IP đúng + https)
app.set("trust proxy", 1);

/* =========================
   CORS
   - Nếu CORS_ORIGIN="*" => allow all
   - Nếu có danh sách domain => giới hạn
   - Nếu chưa set => allow all để test
   ========================= */
const rawCors = String(process.env.CORS_ORIGIN || "").trim();

const allowedOrigins =
  rawCors && rawCors !== "*"
    ? rawCors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =========================
   Middlewares
   ========================= */
app.use(express.json({ limit: process.env.JSON_LIMIT || "10mb" }));
app.use(compression());

// Log gọn (Render logs)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

/* =========================
   Routes
   ========================= */
const adminRoutes = require("./routes/adminRoutes");
const ranhgioiRoutes = require("./routes/ranhgioiRoutes");

// Các routes export { publicRouter, adminRouter }
const dulichRoutes = require("./routes/dulichRoutes");
const anuongRoutes = require("./routes/anuongRoutes");
const muasamRoutes = require("./routes/muasamRoutes");
const dichvuchungRoutes = require("./routes/dichvuchungRoutes");
const luutruRoutes = require("./routes/luutruRoutes");

/**
 * Prefix:
 *  - /api/admin/...   : login & CRUD
 *  - /api/angiang/... : public GET for map
 */

// ✅ 1) ADMIN: login
app.use("/api/admin", adminRoutes);

// ✅ helper: mount router an toàn (nếu thiếu export thì không crash)
const mountIfExists = (base, maybeRouter, name) => {
  if (typeof maybeRouter === "function") {
    app.use(base, maybeRouter);
    console.log(`✅ Mounted ${name} at ${base}`);
  } else {
    console.warn(`⚠️ Skip mount ${name} (router not found)`);
  }
};

// ✅ 2) ADMIN: CRUD
mountIfExists("/api/admin", dulichRoutes.adminRouter, "dulich.adminRouter");
mountIfExists("/api/admin", anuongRoutes.adminRouter, "anuong.adminRouter");
mountIfExists("/api/admin", muasamRoutes.adminRouter, "muasam.adminRouter");
mountIfExists(
  "/api/admin",
  dichvuchungRoutes.adminRouter,
  "dichvuchung.adminRouter"
);
mountIfExists("/api/admin", luutruRoutes.adminRouter, "luutru.adminRouter");

// ✅ 3) PUBLIC WEBGIS (Map)
app.use("/api/angiang", ranhgioiRoutes);
mountIfExists("/api/angiang", dulichRoutes.publicRouter, "dulich.publicRouter");
mountIfExists("/api/angiang", anuongRoutes.publicRouter, "anuong.publicRouter");
mountIfExists("/api/angiang", muasamRoutes.publicRouter, "muasam.publicRouter");
mountIfExists(
  "/api/angiang",
  dichvuchungRoutes.publicRouter,
  "dichvuchung.publicRouter"
);
mountIfExists("/api/angiang", luutruRoutes.publicRouter, "luutru.publicRouter");

/* =========================
   Healthcheck + DB check
   ========================= */
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "dev",
    time: new Date().toISOString(),
  });
});

// ✅ Test DB nhanh: nếu endpoint này OK => DB connect OK
app.get("/api/db-check", async (_req, res) => {
  try {
    const r1 = await pool.query("SELECT 1 AS ok");
    const r2 = await pool.query(
      "SELECT current_database() AS db, current_user AS usr"
    );
    res.json({
      ok: true,
      ping: r1.rows?.[0] || null,
      info: r2.rows?.[0] || null,
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ DB CHECK FAILED:", err?.message || err);
    res.status(500).json({
      ok: false,
      error: String(err?.message || err),
    });
  }
});

// Root route để mở domain không bị {"error":"Not found"}
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "WebGIS An Giang Backend is running",
    health: "/api/health",
    dbCheck: "/api/db-check",
  });
});

/* =========================
   404 + Error handler
   ========================= */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* =========================
   Start server (Render dùng PORT)
   ========================= */
const PORT = Number(process.env.PORT || 5000);
const server = app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);

// graceful shutdown (Render)
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server...");
  server.close(() => process.exit(0));
});
