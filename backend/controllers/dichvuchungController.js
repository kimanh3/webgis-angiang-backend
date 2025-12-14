// backend/controllers/dichvuchungController.js
const pool = require("../db");

/**
 * Helper: xuất FeatureCollection từ bảng POINT
 * - Vá geom NULL / invalid
 * - Vá SRID = 0
 * - Chuẩn EPSG:4326
 */
const fcSql = (qualifiedTable, propsPairs) => `
WITH src AS (
  SELECT *,
         CASE
           WHEN geom IS NULL OR ST_IsEmpty(geom) THEN NULL
           WHEN NOT ST_IsValid(geom)            THEN ST_MakeValid(geom)
           ELSE geom
         END AS g_raw
  FROM ${qualifiedTable}
),
srid_fix AS (
  SELECT *,
         CASE
           WHEN g_raw IS NULL THEN NULL
           WHEN ST_SRID(g_raw) = 0 THEN ST_SetSRID(g_raw, 4326)
           ELSE g_raw
         END AS g_srid
  FROM src
),
g4326 AS (
  SELECT *,
         CASE
           WHEN g_srid IS NULL THEN NULL
           ELSE ST_Transform(g_srid, 4326)
         END AS g1
  FROM srid_fix
)
SELECT jsonb_build_object(
  'type','FeatureCollection',
  'features', COALESCE(jsonb_agg(
    jsonb_build_object(
      'type','Feature',
      'geometry', ST_AsGeoJSON(g1, 6)::jsonb,
      'properties', jsonb_build_object(${propsPairs})
    )
    ORDER BY gid
  ), '[]'::jsonb)
) AS geojson
FROM g4326
WHERE g1 IS NOT NULL;
`;

/* =========================================================
 * 1. API BẢN ĐỒ (GeoJSON)
 * =======================================================*/

exports.getDichVuChungAG = async (_req, res) => {
  try {
    const props = `
      'gid', gid,
      'id', id,
      'ten', ten,
      'dia_chi', dia_chi,
      'loai_dv', loai_dv,
      'gio', gio,
      'sdt', sdt::text,
      'ten_xa', ten_xa,
      'created_at', created_at,
      'updated_at', updated_at,
      'created_by', created_by,
      'updated_by', updated_by
    `;

    const { rows } = await pool.query(
      fcSql("public.diadiemdichvuchung", props)
    );

    res.set("Content-Type", "application/json");
    res.status(200).json(
      rows?.[0]?.geojson ?? { type: "FeatureCollection", features: [] }
    );
  } catch (err) {
    console.error("❌ Lỗi lấy dịch vụ chung:", err);
    res.status(500).json({ error: "Không thể lấy dữ liệu dịch vụ chung An Giang" });
  }
};

/* =========================================================
 * 2. LẤY CHI TIẾT
 * =======================================================*/

exports.getDichVuChungById = async (req, res) => {
  try {
    const { gid } = req.params;

    const sql = `
      SELECT
        gid, id, ten, dia_chi, loai_dv, gio,
        sdt::text AS sdt,
        ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at, updated_at, created_by, updated_by
      FROM public.diadiemdichvuchung
      WHERE gid = $1
    `;

    const { rows } = await pool.query(sql, [gid]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm dịch vụ chung." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getDichVuChungById error:", err);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

/* =========================================================
 * 3. TẠO MỚI
 * =======================================================*/

exports.createDichVuChung = async (req, res) => {
  try {
    const { ten, dia_chi, loai_dv, gio, sdt, ten_xa, lat, lng } = req.body;

    if (!ten || lat == null || lng == null || lat === "" || lng === "") {
      return res.status(400).json({
        message: "Tên, vĩ độ (lat) và kinh độ (lng) là bắt buộc.",
      });
    }

    const adminId = req.user?.id ?? null;

    const sql = `
      INSERT INTO public.diadiemdichvuchung
      (ten, dia_chi, loai_dv, gio, sdt, ten_xa,
       geom, created_at, updated_at, created_by, updated_by)
      VALUES
      ($1, $2, $3, $4, $5, $6,
       ST_SetSRID(
         ST_MakePoint(($8)::double precision, ($7)::double precision),
         4326
       ),
       NOW(), NOW(), $9, $9)
      RETURNING
        gid, id, ten, dia_chi, loai_dv, gio,
        sdt::text AS sdt,
        ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at, updated_at, created_by, updated_by
    `;

    const { rows } = await pool.query(sql, [
      ten,
      dia_chi ?? null,
      loai_dv ?? null,
      gio ?? null,
      sdt ?? null,
      ten_xa ?? null,
      lat,
      lng,
      adminId,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createDichVuChung error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo." });
  }
};

/* =========================================================
 * 4. CẬP NHẬT (FIX TRIỆT ĐỂ LỖI $7)
 * =======================================================*/

exports.updateDichVuChung = async (req, res) => {
  try {
    const { gid } = req.params;
    const { ten, dia_chi, loai_dv, gio, sdt, ten_xa, lat, lng } = req.body;

    const adminId = req.user?.id ?? null;

    const sql = `
      UPDATE public.diadiemdichvuchung
      SET
        ten      = COALESCE($1, ten),
        dia_chi  = COALESCE($2, dia_chi),
        loai_dv  = COALESCE($3, loai_dv),
        gio      = COALESCE($4, gio),
        sdt      = COALESCE($5, sdt),
        ten_xa   = COALESCE($6, ten_xa),

        geom = CASE
          WHEN NULLIF($7::text, '') IS NOT NULL
           AND NULLIF($8::text, '') IS NOT NULL
          THEN ST_SetSRID(
            ST_MakePoint(
              ($8)::double precision,
              ($7)::double precision
            ), 4326)
          ELSE geom
        END,

        updated_at = NOW(),
        updated_by = $10
      WHERE gid = $9
      RETURNING
        gid, id, ten, dia_chi, loai_dv, gio,
        sdt::text AS sdt,
        ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at, updated_at, created_by, updated_by
    `;

    const latParam = lat == null ? "" : String(lat);
    const lngParam = lng == null ? "" : String(lng);

    const { rows } = await pool.query(sql, [
      ten ?? null,
      dia_chi ?? null,
      loai_dv ?? null,
      gio ?? null,
      sdt ?? null,
      ten_xa ?? null,
      latParam,
      lngParam,
      gid,
      adminId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm dịch vụ chung." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("updateDichVuChung error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật." });
  }
};

/* =========================================================
 * 5. XOÁ
 * =======================================================*/

exports.deleteDichVuChung = async (req, res) => {
  try {
    const { gid } = req.params;
    const sql = `DELETE FROM public.diadiemdichvuchung WHERE gid = $1`;
    const result = await pool.query(sql, [gid]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm dịch vụ chung." });
    }

    res.json({ message: "Đã xoá điểm dịch vụ chung." });
  } catch (err) {
    console.error("deleteDichVuChung error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi xoá." });
  }
};
