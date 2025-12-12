// backend/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'DU_LICH_AN_GIANG',
  port:     process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});

// Log trạng thái kết nối (không bắt buộc nhưng giúp debug)
pool.on('connect', () => {
  console.log('✅ Kết nối PostgreSQL thành công');
});

pool.on('error', (err) => {
  console.error('❌ Lỗi kết nối PostgreSQL:', err);
});

module.exports = pool;
