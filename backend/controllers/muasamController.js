// backend/controllers/muasamController.js
const pool = require("../db");

/**
 * Helper: xuất FeatureCollection từ bảng POINT
 * - Vá geom NULL / empty / invalid
 * - Vá SRID=0 → set 4326
 * - Chuẩn hóa 4326 khi xuất
 * - GeoJSON 6 chữ số thập phân
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
 * 1. API CHO BẢN ĐỒ (GeoJSON)
 * =======================================================*/
// GET /api/angiang/muasam
exports.getDiaDiemMuaSamAG = async (_req, res) => {
  try {
    const props = `
      'gid', gid,
      'id', id,
      'ten', ten,
      'dia_chi', dia_chi,
      'gio_mo_cua', gio_mo_cua,
      'loai_hinh', loai_hinh,
      'mo_ta', mo_ta,
      'hinh_anh', hinh_anh,
      'ten_xa', ten_xa,
      'created_at', created_at,
      'updated_at', updated_at,
      'created_by', created_by,
      'updated_by', updated_by
    `;

    const { rows } = await pool.query(fcSql("public.diadiemmuasam", props));

    res.set("Content-Type", "application/json");
    res.status(200).json(rows?.[0]?.geojson ?? { type: "FeatureCollection", features: [] });
  } catch (err) {
    console.error("❌ Lỗi lấy dữ liệu điểm mua sắm:", err);
    res.status(500).json({ error: "Không thể lấy dữ liệu điểm mua sắm An Giang" });
  }
};

/* =========================================================
 * 2. API CHO ADMIN (CRUD)
 * =======================================================*/

/** GET /api/admin/muasam/:gid */
exports.getDiaDiemMuaSamById = async (req, res) => {
  try {
    const { gid } = req.params;

    const sql = `
      SELECT
        gid, id, ten, dia_chi, gio_mo_cua, loai_hinh, mo_ta, hinh_anh, ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at, updated_at, created_by, updated_by
      FROM public.diadiemmuasam
      WHERE gid = $1
    `;

    const { rows } = await pool.query(sql, [gid]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm mua sắm." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getDiaDiemMuaSamById error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết." });
  }
};

/** POST /api/admin/muasam */
exports.createDiaDiemMuaSam = async (req, res) => {
  try {
    const { ten, dia_chi, gio_mo_cua, loai_hinh, mo_ta, hinh_anh, ten_xa, lat, lng } =
      req.body;

    // bắt buộc: ten + lat + lng
    if (!ten || lat == null || lng == null || lat === "" || lng === "") {
      return res.status(400).json({
        message: "Tên, vĩ độ (lat) và kinh độ (lng) là bắt buộc.",
      });
    }

    const adminId = req.user?.id ?? null;

    const sql = `
      INSERT INTO public.diadiemmuasam
      (ten, dia_chi, gio_mo_cua, loai_hinh, mo_ta, hinh_anh,
       ten_xa,
       geom, created_at, updated_at, created_by, updated_by)
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7,
        ST_SetSRID(
          ST_MakePoint(
            NULLIF($9, '')::double precision,  -- lng
            NULLIF($8, '')::double precision   -- lat
          ),
          4326
        ),
        NOW(), NOW(), $10, $10
      )
      RETURNING
        gid, id, ten, dia_chi, gio_mo_cua, loai_hinh, mo_ta, hinh_anh, ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at, updated_at, created_by, updated_by
    `;

    const { rows } = await pool.query(sql, [
      ten,                // $1
      dia_chi ?? null,    // $2
      gio_mo_cua ?? null, // $3
      loai_hinh ?? null,  // $4
      mo_ta ?? null,      // $5
      hinh_anh ?? null,   // $6
      ten_xa ?? null,     // $7
      lat,                // $8
      lng,                // $9
      adminId,            // $10
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createDiaDiemMuaSam error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo điểm mua sắm mới." });
  }
};

/** PUT /api/admin/muasam/:gid (✅ FIX TRIỆT ĐỂ kiểu lat/lng) */
exports.updateDiaDiemMuaSam = async (req, res) => {
  try {
    const { gid } = req.params;
    const { ten, dia_chi, gio_mo_cua, loai_hinh, mo_ta, hinh_anh, ten_xa, lat, lng } =
      req.body;

    const adminId = req.user?.id ?? null;

    const sql = `
      UPDATE public.diadiemmuasam
      SET
        ten        = COALESCE($1, ten),
        dia_chi    = COALESCE($2, dia_chi),
        gio_mo_cua = COALESCE($3, gio_mo_cua),
        loai_hinh  = COALESCE($4, loai_hinh),
        mo_ta      = COALESCE($5, mo_ta),
        hinh_anh   = COALESCE($6, hinh_anh),
        ten_xa     = COALESCE($7, ten_xa),

        geom = CASE
          WHEN NULLIF($8::text, '') IS NOT NULL
           AND NULLIF($9::text, '') IS NOT NULL
          THEN ST_SetSRID(
            ST_MakePoint(
              NULLIF($9::text, '')::double precision,  -- lng
              NULLIF($8::text, '')::double precision   -- lat
            ),
            4326
          )
          ELSE geom
        END,

        updated_at = NOW(),
        updated_by = $11
      WHERE gid = $10
      RETURNING
        gid, id, ten, dia_chi, gio_mo_cua, loai_hinh, mo_ta, hinh_anh, ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at, updated_at, created_by, updated_by
    `;

    // ép về string để NULLIF($8::text,'') luôn ổn định
    const latParam = lat == null ? "" : String(lat);
    const lngParam = lng == null ? "" : String(lng);

    const { rows } = await pool.query(sql, [
      ten ?? null,         // $1
      dia_chi ?? null,     // $2
      gio_mo_cua ?? null,  // $3
      loai_hinh ?? null,   // $4
      mo_ta ?? null,       // $5
      hinh_anh ?? null,    // $6
      ten_xa ?? null,      // $7
      latParam,            // $8
      lngParam,            // $9
      gid,                 // $10
      adminId,             // $11
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm mua sắm để cập nhật." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("updateDiaDiemMuaSam error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật." });
  }
};

/** DELETE /api/admin/muasam/:gid */
exports.deleteDiaDiemMuaSam = async (req, res) => {
  try {
    const { gid } = req.params;

    const sql = "DELETE FROM public.diadiemmuasam WHERE gid = $1";
    const result = await pool.query(sql, [gid]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm mua sắm để xoá." });
    }

    res.json({ message: "Đã xoá điểm mua sắm." });
  } catch (err) {
    console.error("deleteDiaDiemMuaSam error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi xoá." });
  }
};
