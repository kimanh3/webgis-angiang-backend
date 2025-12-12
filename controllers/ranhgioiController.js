// controllers/ranhgioiController.js
const pool = require('../db');

/**
 * Trả về FeatureCollection ranh giới cấp xã An Giang.
 * - Sửa hình lỗi/khuyết: ST_MakeValid
 * - Ép MULTI: ST_Multi
 * - Vá SRID=0: ST_SetSRID(..., 4326) nếu thiếu
 * - Chuẩn hóa 4326 khi xuất + giới hạn 6 chữ số
 */
exports.getRanhGioiAG = async (_req, res) => {
  try {
    const sql = `
      WITH fixed AS (
        SELECT
          gid, ma_xa, ten_xa, sap_nhap, tru_so, loai, cap, stt,
          dtich_km2, dan_so, matdo_km2, ma_tinh, ten_tinh,
          ST_Multi(
            CASE
              WHEN geom IS NULL OR ST_IsEmpty(geom) THEN NULL
              WHEN NOT ST_IsValid(geom)            THEN ST_MakeValid(geom)
              ELSE geom
            END
          ) AS g_raw
        FROM public.ranhgioiag
      ),
      srid_fix AS (
        SELECT
          *,
          -- Nếu SRID đang là 0/unknown thì gán 4326 (giả định dữ liệu là lon/lat)
          CASE
            WHEN ST_SRID(g_raw) = 0 THEN ST_SetSRID(g_raw, 4326)
            ELSE g_raw
          END AS g_srid
        FROM fixed
      ),
      g4326 AS (
        -- Transform về 4326 (trường hợp dữ liệu gốc đã 4326 thì phép biến đổi là identity)
        SELECT *, ST_Transform(g_srid, 4326) AS g1 FROM srid_fix
      ),
      simp AS (
        -- Giảm nhẹ số đỉnh để render mượt hơn
        SELECT *, ST_SimplifyPreserveTopology(g1, 0.00005) AS g
        FROM g4326
      )
      SELECT jsonb_build_object(
        'type','FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type','Feature',
            'geometry', ST_AsGeoJSON(g, 6)::jsonb,
            'properties', jsonb_build_object(
              'gid', gid,
              'ma_xa', ma_xa,
              'ten_xa', ten_xa,
              'sap_nhap', sap_nhap,
              'tru_so', tru_so,
              'loai', loai,
              'cap', cap,
              'stt', stt,
              'dtich_km2', dtich_km2,
              'dan_so', dan_so,
              'matdo_km2', matdo_km2,
              'ma_tinh', ma_tinh,
              'ten_tinh', ten_tinh
            )
          )
          ORDER BY gid
        ), '[]'::jsonb)
      ) AS geojson
      FROM simp
      WHERE g IS NOT NULL;
    `;

    const { rows } = await pool.query(sql);
    res.set('Content-Type', 'application/json');
    res.status(200).json(rows?.[0]?.geojson ?? { type: 'FeatureCollection', features: [] });
  } catch (err) {
    console.error('❌ Lỗi lấy ranh giới:', err);
    res.status(500).json({ error: 'Không thể lấy dữ liệu ranh giới An Giang' });
  }
};
