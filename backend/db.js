// backend/db.js
require("dotenv").config();
const { Pool } = require("pg");

// ===================== Helpers =====================
function parseBool(v, defaultValue = false) {
  if (v === undefined || v === null || v === "") return defaultValue;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(s)) return true;
  if (["false", "0", "no", "n", "off"].includes(s)) return false;
  return defaultValue;
}

const NODE_ENV = String(process.env.NODE_ENV || "development").toLowerCase();
const isProduction = NODE_ENV === "production";

// ✅ Hỗ trợ 2 key để tránh bạn đặt nhầm trên Render
// - ĐÚNG: DATABASE_URL
// - LỠ NHẦM: DATABASE_URL
const DATABASE_URL = String(
  process.env.DATABASE_URL || process.env.DATABASE_URL || ""
).trim();

// DB_* fallback
const hostFromEnv = String(process.env.DB_HOST || "").trim();

const isRemoteHost =
  !!hostFromEnv && !["localhost", "127.0.0.1", "::1"].includes(hostFromEnv);

const looksLikeNeon =
  hostFromEnv.includes("neon.tech") || DATABASE_URL.includes("neon.tech");

const urlWantsSSL = /sslmode=require/i.test(DATABASE_URL);

// ✅ SSL rule (QUAN TRỌNG):
// - Nếu bạn set DB_SSL => ưu tiên DB_SSL
// - Nếu không set DB_SSL => production/remote/neon/url sslmode=require => bật SSL
const sslEnabled = parseBool(
  process.env.DB_SSL,
  isProduction || isRemoteHost || looksLikeNeon || urlWantsSSL
);

// Pool tuning
const PG_POOL_MAX = process.env.PG_POOL_MAX ? Number(process.env.PG_POOL_MAX) : 10;
const PG_IDLE_TIMEOUT = process.env.PG_IDLE_TIMEOUT
  ? Number(process.env.PG_IDLE_TIMEOUT)
  : 30_000;
const PG_CONN_TIMEOUT = process.env.PG_CONN_TIMEOUT
  ? Number(process.env.PG_CONN_TIMEOUT)
  : 10_000;

// ===================== Build config =====================
let pool;

if (DATABASE_URL) {
  // ✅ Ưu tiên DATABASE_URL khi deploy
  pool = new Pool({
    connectionString: DATABASE_URL,

    // 🔥 BẮT BUỘC: node-postgres cần ssl option (Neon sẽ lỗi "connection is insecure" nếu không)
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,

    max: PG_POOL_MAX,
    idleTimeoutMillis: PG_IDLE_TIMEOUT,
    connectionTimeoutMillis: PG_CONN_TIMEOUT,

    // ổn định hơn trên host free
    keepAlive: true,
  });

  console.log("🔎 DB MODE: DATABASE_URL");
} else {
  // ✅ Fallback theo DB_*
  const host = hostFromEnv || "localhost";
  const user = String(process.env.DB_USER || "postgres").trim();
  const password = process.env.DB_PASSWORD || "";
  const database = String(process.env.DB_NAME || "DU_LICH_AN_GIANG").trim();
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;

  pool = new Pool({
    host,
    user,
    password,
    database,
    port,

    // 🔥 SSL bắt buộc nếu host neon/remote/production
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,

    max: PG_POOL_MAX,
    idleTimeoutMillis: PG_IDLE_TIMEOUT,
    connectionTimeoutMillis: PG_CONN_TIMEOUT,
    keepAlive: true,
  });

  console.log("🔎 DB MODE: DB_HOST/DB_USER/DB_NAME");
  console.log(
    `🔎 ENV=${NODE_ENV} host=${host} port=${port} db=${database} user=${user} ssl=${sslEnabled}`
  );
}

// ===================== Events =====================
pool.on("connect", () => {
  console.log("✅ PostgreSQL pool connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err?.message || err);
});

// ✅ Ping DB khi boot để bắt lỗi SSL/host ngay trên Render Logs
(async () => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    console.log("✅ DB ping OK:", r?.rows?.[0]);
  } catch (e) {
    console.error("❌ DB ping FAILED:", e?.message || e);
  }
})();

module.exports = pool;
