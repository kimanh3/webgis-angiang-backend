// backend/controllers/dulichController.js
const pool = require("../db");

/* Helper: xuất FeatureCollection từ bảng POINT
   - MakeValid hình học
   - Vá SRID=0 → ST_SetSRID(..., 4326)
   - Chuẩn hóa về EPSG:4326 khi xuất
   - Giới hạn 6 chữ số thập phân GeoJSON
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
  -- nếu đã là 4326 thì transform là identity (an toàn)
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

/* ================== API CHO BẢN ĐỒ (GeoJSON) ================== */

// GET /api/angiang/dulich
exports.getDiaDiemDuLichAG = async (_req, res) => {
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
      'ten_xa', ten_xa
    `;
    const { rows } = await pool.query(
      fcSql("public.diadiemdulich", props)
    );
    res.set("Content-Type", "application/json");
    res
      .status(200)
      .json(
        rows?.[0]?.geojson ?? { type: "FeatureCollection", features: [] }
      );
  } catch (err) {
    console.error("❌ Lỗi lấy dữ liệu du lịch:", err);
    res
      .status(500)
      .json({ error: "Không thể lấy dữ liệu điểm du lịch An Giang" });
  }
};

/* ================== API CHO ADMIN (CRUD THẬT) ================== */

/**
 * GET /api/admin/dulich/:gid
 * Lấy chi tiết 1 điểm du lịch (dùng cho form sửa)
 */
exports.getDiemDuLichById = async (req, res) => {
  try {
    const { gid } = req.params;
    const sql = `
      SELECT gid, id, ten, dia_chi, loai_hinh, gio_mo_cua, mo_ta, hinh_anh,
             ten_xa,
             ST_Y(geom) AS lat, ST_X(geom) AS lng,
             created_at, updated_at, created_by, updated_by
      FROM public.diadiemdulich
      WHERE gid = $1
    `;
    const { rows } = await pool.query(sql, [gid]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy điểm du lịch." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getDiemDuLichById error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết." });
  }
};

/**
 * POST /api/admin/dulich
 * Tạo mới điểm du lịch
 * Body JSON: { ten, dia_chi, loai_hinh, gio_mo_cua, mo_ta, hinh_anh, ten_xa, lat, lng }
 */
exports.createDiemDuLich = async (req, res) => {
  try {
    const {
      ten,
      dia_chi,
      loai_hinh,
      gio_mo_cua,
      mo_ta,
      hinh_anh,
      ten_xa,
      lat,
      lng,
    } = req.body;

    if (!ten || lat == null || lng == null) {
      return res.status(400).json({
        message: "Tên, vĩ độ (lat) và kinh độ (lng) là bắt buộc.",
      });
    }

    // Nếu sau này bạn có middleware auth thì có thể gán req.user.id
    const adminId = req.user?.id || null;

    const sql = `
      INSERT INTO public.diadiemdulich
      (ten, dia_chi, loai_hinh, gio_mo_cua, mo_ta, hinh_anh,
       ten_xa,
       geom, created_at, updated_at, created_by, updated_by)
      VALUES
      ($1, $2, $3, $4, $5, $6,
       $7,
       ST_SetSRID(ST_MakePoint($9, $8), 4326),
       NOW(), NOW(), $10, $10)
      RETURNING gid, id, ten, dia_chi, loai_hinh, gio_mo_cua, mo_ta, hinh_anh,
                ten_xa,
                ST_Y(geom) AS lat, ST_X(geom) AS lng,
                created_at, updated_at, created_by, updated_by
    `;

    const { rows } = await pool.query(sql, [
      ten,
      dia_chi || null,
      loai_hinh || null,
      gio_mo_cua || null,
      mo_ta || null,
      hinh_anh || null,
      ten_xa || null, // $7
      lat,            // $8
      lng,            // $9
      adminId,        // $10
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createDiemDuLich error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo điểm du lịch." });
  }
};

/**
 * PUT /api/admin/dulich/:gid
 * Cập nhật điểm du lịch
 */
exports.updateDiemDuLich = async (req, res) => {
  try {
    const { gid } = req.params;
    const {
      ten,
      dia_chi,
      loai_hinh,
      gio_mo_cua,
      mo_ta,
      hinh_anh,
      ten_xa,
      lat,
      lng,
    } = req.body;

    const adminId = req.user?.id || null;

    const sql = `
      UPDATE public.diadiemdulich
      SET ten       = COALESCE($1, ten),
          dia_chi   = COALESCE($2, dia_chi),
          loai_hinh = COALESCE($3, loai_hinh),
          gio_mo_cua= COALESCE($4, gio_mo_cua),
          mo_ta     = COALESCE($5, mo_ta),
          hinh_anh  = COALESCE($6, hinh_anh),
          ten_xa    = COALESCE($7, ten_xa),
          geom = CASE
                   WHEN $8 IS NOT NULL AND $9 IS NOT NULL
                     THEN ST_SetSRID(ST_MakePoint($9, $8), 4326)
                   ELSE geom
                 END,
          updated_at = NOW(),
          updated_by = $11
      WHERE gid = $10
      RETURNING gid, id, ten, dia_chi, loai_hinh, gio_mo_cua, mo_ta, hinh_anh,
                ten_xa,
                ST_Y(geom) AS lat, ST_X(geom) AS lng,
                created_at, updated_at, created_by, updated_by
    `;

    const { rows } = await pool.query(sql, [
      ten || null,        // $1
      dia_chi || null,    // $2
      loai_hinh || null,  // $3
      gio_mo_cua || null, // $4
      mo_ta || null,      // $5
      hinh_anh || null,   // $6
      ten_xa || null,     // $7
      lat || null,        // $8
      lng || null,        // $9
      gid,                // $10
      adminId,            // $11
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy điểm du lịch." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("updateDiemDuLich error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật." });
  }
};

/**
 * DELETE /api/admin/dulich/:gid
 * Xoá điểm du lịch
 */
exports.deleteDiemDuLich = async (req, res) => {
  try {
    const { gid } = req.params;
    const sql = "DELETE FROM public.diadiemdulich WHERE gid = $1";
    const result = await pool.query(sql, [gid]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy điểm du lịch." });
    }

    res.json({ message: "Đã xoá điểm du lịch." });
  } catch (err) {
    console.error("deleteDiemDuLich error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi xoá." });
  }
};
