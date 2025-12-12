// backend/controllers/luutruController.js
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

/* ================== 1. LẤY LIST LƯU TRÚ (CHO BẢN ĐỒ) ================== */
// GET /api/angiang/luutru
exports.getDiemLuuTruAG = async (_req, res) => {
  try {
    // sdt là double precision → cast sang text để không mất số 0 đầu
    const props = `
      'gid', gid,
      'id', id,
      'ten', ten,
      'dia_chi', dia_chi,
      'hang_sao', hang_sao,
      'sdt', sdt::text,
      'gia', gia,
      'hinh_anh', hinh_anh,
      'ten_xa', ten_xa,
      'created_at', created_at,
      'updated_at', updated_at,
      'created_by', created_by,
      'updated_by', updated_by
    `;
    const { rows } = await pool.query(fcSql("public.diemluutru", props));

    res.set("Content-Type", "application/json");
    res
      .status(200)
      .json(
        rows?.[0]?.geojson ?? { type: "FeatureCollection", features: [] }
      );
  } catch (err) {
    console.error("❌ Lỗi lấy điểm lưu trú:", err);
    res
      .status(500)
      .json({ error: "Không thể lấy dữ liệu điểm lưu trú An Giang" });
  }
};

/* =============== 2. LẤY CHI TIẾT 1 ĐIỂM LƯU TRÚ (CHO FORM SỬA) =============== */
// GET /api/admin/luutru/:gid (hoặc route bạn đang dùng)
exports.getDiemLuuTruById = async (req, res) => {
  try {
    const { gid } = req.params;

    const sql = `
      SELECT 
        gid,
        id,
        ten,
        dia_chi,
        hang_sao,
        sdt::text AS sdt,
        gia,
        hinh_anh,
        ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at,
        updated_at,
        created_by,
        updated_by
      FROM public.diemluutru
      WHERE gid = $1
    `;

    const { rows } = await pool.query(sql, [gid]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy điểm lưu trú." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getDiemLuuTruById error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết." });
  }
};

/* ===================== 3. TẠO MỚI ĐIỂM LƯU TRÚ ===================== */
// POST /api/admin/luutru
exports.createDiemLuuTru = async (req, res) => {
  try {
    const {
      ten,
      dia_chi,
      hang_sao,
      sdt,
      gia,
      hinh_anh,
      ten_xa,
      lat,
      lng, // kinh độ
    } = req.body;

    if (!ten || lat == null || lng == null) {
      return res.status(400).json({
        message: "Tên, vĩ độ (lat) và kinh độ (lng) là bắt buộc.",
      });
    }

    const adminId = req.user?.id || null;

    const sql = `
      INSERT INTO public.diemluutru
        (ten, dia_chi, hang_sao, sdt, gia, hinh_anh,
         ten_xa,
         geom, created_at, updated_at, created_by, updated_by)
      VALUES
        ($1, $2, $3, $4, $5, $6,
         $7,
         ST_SetSRID(ST_MakePoint($9, $8), 4326),
         NOW(), NOW(), $10, $10)
      RETURNING 
        gid,
        id,
        ten,
        dia_chi,
        hang_sao,
        sdt::text AS sdt,
        gia,
        hinh_anh,
        ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at,
        updated_at,
        created_by,
        updated_by
    `;

    const { rows } = await pool.query(sql, [
      ten,                // $1
      dia_chi || null,    // $2
      hang_sao || null,   // $3
      sdt ?? null,        // $4
      gia || null,        // $5
      hinh_anh || null,   // $6
      ten_xa || null,     // $7
      lat,                // $8
      lng,                // $9
      adminId,            // $10
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createDiemLuuTru error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo điểm lưu trú." });
  }
};

/* ===================== 4. CẬP NHẬT ĐIỂM LƯU TRÚ ===================== */
// PUT /api/admin/luutru/:gid
exports.updateDiemLuuTru = async (req, res) => {
  try {
    const { gid } = req.params;
    const {
      ten,
      dia_chi,
      hang_sao,
      sdt,
      gia,
      hinh_anh,
      ten_xa,
      lat,
      lng,
    } = req.body;

    const adminId = req.user?.id || null;

    const sql = `
      UPDATE public.diemluutru
      SET
        ten       = COALESCE($1, ten),
        dia_chi   = COALESCE($2, dia_chi),
        hang_sao  = COALESCE($3, hang_sao),
        sdt       = COALESCE($4, sdt),
        gia       = COALESCE($5, gia),
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
      RETURNING
        gid,
        id,
        ten,
        dia_chi,
        hang_sao,
        sdt::text AS sdt,
        gia,
        hinh_anh,
        ten_xa,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng,
        created_at,
        updated_at,
        created_by,
        updated_by
    `;

    const { rows } = await pool.query(sql, [
      ten || null,         // $1
      dia_chi || null,     // $2
      hang_sao || null,    // $3
      sdt ?? null,         // $4
      gia || null,         // $5
      hinh_anh || null,    // $6
      ten_xa || null,      // $7
      lat || null,         // $8
      lng || null,         // $9
      gid,                 // $10
      adminId,             // $11
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy điểm lưu trú." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("updateDiemLuuTru error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật." });
  }
};

/* ======================= 5. XOÁ ĐIỂM LƯU TRÚ ======================= */
// DELETE /api/admin/luutru/:gid
exports.deleteDiemLuuTru = async (req, res) => {
  try {
    const { gid } = req.params;

    const sql = "DELETE FROM public.diemluutru WHERE gid = $1";
    const result = await pool.query(sql, [gid]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy điểm lưu trú." });
    }

    res.json({ message: "Đã xoá điểm lưu trú." });
  } catch (err) {
    console.error("deleteDiemLuuTru error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi xoá." });
  }
};
