// backend/controllers/dichvuchungController.js
const pool = require("../db");

/* Helper: xuất FeatureCollection từ bảng POINT (vá SRID=0, make valid, chuẩn 4326) */
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
  -- nếu đã là 4326 thì transform là identity
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

/* ==================== 1. API LẤY TOÀN BỘ (CHO BẢN ĐỒ) ==================== */
// GET /api/angiang/dichvuchung
exports.getDichVuChungAG = async (_req, res) => {
  try {
    // sdt là double precision → cast sang text để không mất định dạng khi trả JSON
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
    res
      .status(200)
      .json(
        rows?.[0]?.geojson ?? { type: "FeatureCollection", features: [] }
      );
  } catch (err) {
    console.error("❌ Lỗi lấy dịch vụ chung:", err);
    res
      .status(500)
      .json({ error: "Không thể lấy dữ liệu dịch vụ chung An Giang" });
  }
};

/* ==================== 2. LẤY CHI TIẾT 1 ĐIỂM ==================== */
// GET /api/admin/dichvuchung/:gid
exports.getDichVuChungById = async (req, res) => {
  try {
    const { gid } = req.params;
    const sql = `
      SELECT
        gid,
        id,
        ten,
        dia_chi,
        loai_dv,
        gio,
        sdt::text AS sdt,
        ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at,
        updated_at,
        created_by,
        updated_by
      FROM public.diadiemdichvuchung
      WHERE gid = $1
    `;
    const { rows } = await pool.query(sql, [gid]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy điểm dịch vụ chung." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getDichVuChungById error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết." });
  }
};

/* ==================== 3. TẠO MỚI ==================== */
// POST /api/admin/dichvuchung
exports.createDichVuChung = async (req, res) => {
  try {
    const { ten, dia_chi, loai_dv, gio, sdt, ten_xa, lat, lng } = req.body;

    if (!ten || lat == null || lng == null) {
      return res.status(400).json({
        message: "Tên, vĩ độ (lat) và kinh độ (lng) là bắt buộc.",
      });
    }

    const adminId = req.user?.id || null;

    const sql = `
      INSERT INTO public.diadiemdichvuchung
        (ten, dia_chi, loai_dv, gio, sdt,
         ten_xa,
         geom, created_at, updated_at, created_by, updated_by)
      VALUES
        ($1,  $2,      $3,      $4,  $5,
         $6,
         ST_SetSRID(ST_MakePoint($8, $7), 4326),
         NOW(), NOW(), $9, $9)
      RETURNING
        gid,
        id,
        ten,
        dia_chi,
        loai_dv,
        gio,
        sdt::text AS sdt,
        ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at,
        updated_at,
        created_by,
        updated_by
    `;

    const { rows } = await pool.query(sql, [
      ten,                 // $1
      dia_chi || null,     // $2
      loai_dv || null,     // $3
      gio || null,         // $4
      sdt ?? null,         // $5
      ten_xa || null,      // $6
      lat,                 // $7
      lng,                 // $8
      adminId,             // $9
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createDichVuChung error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo điểm dịch vụ chung." });
  }
};

/* ==================== 4. CẬP NHẬT ==================== */
// PUT /api/admin/dichvuchung/:gid
exports.updateDichVuChung = async (req, res) => {
  try {
    const { gid } = req.params;
    const { ten, dia_chi, loai_dv, gio, sdt, ten_xa, lat, lng } = req.body;

    const adminId = req.user?.id || null;

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
                 WHEN $7 IS NOT NULL AND $8 IS NOT NULL
                   THEN ST_SetSRID(ST_MakePoint($8, $7), 4326)
                 ELSE geom
               END,
        updated_at = NOW(),
        updated_by = $10
      WHERE gid = $9
      RETURNING
        gid,
        id,
        ten,
        dia_chi,
        loai_dv,
        gio,
        sdt::text AS sdt,
        ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at,
        updated_at,
        created_by,
        updated_by
    `;

    const { rows } = await pool.query(sql, [
      ten || null,        // $1
      dia_chi || null,    // $2
      loai_dv || null,    // $3
      gio || null,        // $4
      sdt ?? null,        // $5
      ten_xa || null,     // $6
      lat || null,        // $7
      lng || null,        // $8
      gid,                // $9
      adminId,            // $10
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy điểm dịch vụ chung." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("updateDichVuChung error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật." });
  }
};

/* ==================== 5. XOÁ ==================== */
// DELETE /api/admin/dichvuchung/:gid
exports.deleteDichVuChung = async (req, res) => {
  try {
    const { gid } = req.params;
    const sql = "DELETE FROM public.diadiemdichvuchung WHERE gid = $1";
    const result = await pool.query(sql, [gid]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy điểm dịch vụ chung." });
    }

    res.json({ message: "Đã xoá điểm dịch vụ chung." });
  } catch (err) {
    console.error("deleteDichVuChung error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi xoá." });
  }
};
