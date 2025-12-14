// backend/controllers/anuongController.js
const pool = require("../db");

/**
 * Helper: xuất FeatureCollection từ bảng POINT
 * - Vá hình học NULL / invalid
 * - Chuẩn SRID 4326
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
           WHEN ST_SRID(g_raw) = 0 THEN ST_SetSRID(g_raw, 4326)  -- vá SRID thiếu
           ELSE g_raw
         END AS g_srid
  FROM src
),
g4326 AS (
  -- nếu đã là 4326 thì ST_Transform sẽ là identity, an toàn
  SELECT *, ST_Transform(g_srid, 4326) AS g1
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
 * 1. API CHO BẢN ĐỒ (GeoJSON)
 * =======================================================*/

/** Lấy toàn bộ điểm ăn uống (GeoJSON) */
exports.getDiaDiemAnUongAG = async (_req, res) => {
  try {
    const props = `
      'gid', gid,
      'id', id,
      'ten', ten,
      'dia_chi', dia_chi,
      'gio_mo_cua', gio_mo_cua,
      'loai_hinh', loai_hinh,
      'hinh_anh', hinh_anh,
      'ten_xa', ten_xa,
      'created_at', created_at,
      'updated_at', updated_at,
      'created_by', created_by,
      'updated_by', updated_by
    `;
    const { rows } = await pool.query(
      fcSql("public.diadiemanuong", props)
    );
    res.set("Content-Type", "application/json");
    res
      .status(200)
      .json(
        rows?.[0]?.geojson ?? { type: "FeatureCollection", features: [] }
      );
  } catch (err) {
    console.error("❌ Lỗi lấy điểm ăn uống:", err);
    res
      .status(500)
      .json({ error: "Không thể lấy dữ liệu điểm ăn uống An Giang" });
  }
};

/* =========================================================
 * 2. API CHO ADMIN (CRUD)
 * =======================================================*/

/** Lấy chi tiết 1 điểm ăn uống theo gid (cho form sửa) */
exports.getDiaDiemAnUongById = async (req, res) => {
  try {
    const { gid } = req.params;
    const sql = `
      SELECT gid, id, ten, dia_chi, loai_hinh, gio_mo_cua, hinh_anh,
             ten_xa,
             created_at, updated_at, created_by, updated_by,
             ST_Y(geom) AS lat, ST_X(geom) AS lng
      FROM public.diadiemanuong
      WHERE gid = $1
    `;
    const { rows } = await pool.query(sql, [gid]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm ăn uống." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getDiaDiemAnUongById error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết." });
  }
};

/** Tạo mới điểm ăn uống */
exports.createDiaDiemAnUong = async (req, res) => {
  try {
    const {
      ten,
      dia_chi,
      loai_hinh,
      gio_mo_cua,
      hinh_anh,
      ten_xa,
      lat,
      lng,
    } = req.body;

    if (!ten || lat == null || lng == null) {
      return res.status(400).json({
        message: "Tên (ten), vĩ độ (lat) và kinh độ (lng) là bắt buộc.",
      });
    }

    const adminId = req.user?.id || null;

    const sql = `
      INSERT INTO public.diadiemanuong
      ( ten, dia_chi, loai_hinh, gio_mo_cua, hinh_anh,
        ten_xa,
        geom, created_at, updated_at, created_by, updated_by )
      VALUES
      ( $1,  $2,      $3,        $4,        $5,
        $6,
        ST_SetSRID(ST_MakePoint($8, $7), 4326),
        NOW(), NOW(), $9, $9 )
      RETURNING gid, id, ten, dia_chi, loai_hinh, gio_mo_cua, hinh_anh,
                ten_xa,
                created_at, updated_at, created_by, updated_by,
                ST_Y(geom) AS lat, ST_X(geom) AS lng
    `;

    const { rows } = await pool.query(sql, [
      ten,
      dia_chi || null,
      loai_hinh || null,
      gio_mo_cua || null,
      hinh_anh || null,
      ten_xa || null, // $6
      lat,            // $7
      lng,            // $8
      adminId,        // $9
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createDiaDiemAnUong error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo điểm ăn uống." });
  }
};

/** Cập nhật điểm ăn uống */
exports.updateDiaDiemAnUong = async (req, res) => {
  try {
    const { gid } = req.params;
    const {
      ten,
      dia_chi,
      loai_hinh,
      gio_mo_cua,
      hinh_anh,
      ten_xa,
      lat,
      lng,
    } = req.body;

    const adminId = req.user?.id || null;

    const sql = `
      UPDATE public.diadiemanuong
      SET ten       = COALESCE($1, ten),
          dia_chi   = COALESCE($2, dia_chi),
          loai_hinh = COALESCE($3, loai_hinh),
          gio_mo_cua= COALESCE($4, gio_mo_cua),
          hinh_anh  = COALESCE($5, hinh_anh),
          ten_xa    = COALESCE($6, ten_xa),
          geom = CASE
                   WHEN $7 IS NOT NULL AND $8 IS NOT NULL
                     THEN ST_SetSRID(ST_MakePoint($8, $7), 4326)
                   ELSE geom
                 END,
          updated_at = NOW(),
          updated_by = $10
      WHERE gid = $9
      RETURNING gid, id, ten, dia_chi, loai_hinh, gio_mo_cua, hinh_anh,
                ten_xa,
                created_at, updated_at, created_by, updated_by,
                ST_Y(geom) AS lat, ST_X(geom) AS lng
    `;

    const { rows } = await pool.query(sql, [
      ten || null,        // $1
      dia_chi || null,    // $2
      loai_hinh || null,  // $3
      gio_mo_cua || null, // $4
      hinh_anh || null,   // $5
      ten_xa || null,     // $6
      lat || null,        // $7
      lng || null,        // $8
      gid,                // $9
      adminId,            // $10
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm ăn uống." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("updateDiaDiemAnUong error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật điểm ăn uống." });
  }
};

/** Xoá điểm ăn uống */
exports.deleteDiaDiemAnUong = async (req, res) => {
  try {
    const { gid } = req.params;
    const sql = `DELETE FROM public.diadiemanuong WHERE gid = $1`;
    const result = await pool.query(sql, [gid]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm ăn uống." });
    }

    res.json({ message: "Đã xoá điểm ăn uống." });
  } catch (err) {
    console.error("deleteDiaDiemAnUong error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi xoá điểm ăn uống." });
  }
};
