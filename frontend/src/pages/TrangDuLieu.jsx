// src/pages/TrangDuLieu.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ API cho từng lớp điểm
import { listDuLich } from "../api/dulichApi";
import { listAmThuc } from "../api/anuongApi";
import { listMuaSam } from "../api/muasamApi";
import { listLuuTru } from "../api/luutruApi";
import { listDichVuChung } from "../api/dichvuchungApi";
// ✅ API ranh giới hành chính (chứa ten_xa)
import { listRanhGioi } from "../api/ranhgioiApi";

const TABS = [
  { id: "dulich", label: "Điểm du lịch" },
  { id: "amthuc", label: "Ẩm thực" },
  { id: "muasam", label: "Mua sắm" },
  { id: "luutru", label: "Lưu trú" },
  { id: "dichvu", label: "Dịch vụ khác" },
];

// Gom nhóm lớn (giữ lại nếu sau cần dùng)
function groupLoaiHinh(loai) {
  if (!loai) return "Khác";
  const s = loai.toLowerCase();

  if (s.includes("tâm linh") || s.includes("tín ngưỡng"))
    return "Tâm linh – tín ngưỡng";
  if (s.includes("nghỉ dưỡng") || s.includes("giải trí"))
    return "Nghỉ dưỡng – giải trí";
  if (s.includes("sinh thái") || s.includes("rừng tràm"))
    return "Sinh thái – thiên nhiên";
  if (s.includes("lịch sử") || s.includes("văn hóa"))
    return "Văn hóa – lịch sử";

  return "Khác";
}

// Bỏ dấu + đưa về chữ thường để so sánh
function normalize(str = "") {
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Đoán đơn vị hành chính (xã/phường/thị trấn) cho 1 địa chỉ
 * dựa trên danh sách tên xã từ bảng ranh giới (ten_xa).
 */
function guessDonViFromDiaChi(dia_chi, xaNames) {
  if (!dia_chi) return "Không rõ";
  const nd = normalize(dia_chi);

  // Ưu tiên khớp chính xác nhất: xaNames đã bỏ dấu, lower-case
  for (const xa of xaNames) {
    const nXa = normalize(xa);
    if (!nXa) continue;
    if (nd.includes(nXa)) {
      return xa; // trả về đúng tên gốc có dấu
    }
  }

  return "Không rõ";
}

export default function TrangDuLieu() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dulich");

  // dữ liệu thô cho 5 lớp (đã gắn thêm field donvi)
  const [dulich, setDulich] = useState([]);
  const [amthuc, setAmthuc] = useState([]);
  const [muasam, setMuasam] = useState([]);
  const [luutru, setLuutru] = useState([]);
  const [dichvu, setDichvu] = useState([]);

  // bộ lọc & search
  const [search, setSearch] = useState("");
  const [filterDonVi, setFilterDonVi] = useState("ALL"); // đơn vị hành chính (ten_xa)
  const [filterLoai, setFilterLoai] = useState("ALL");

  // ====== LẤY DỮ LIỆU TỪ BACKEND (CÓ RANH GIỚI) ======
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. Lấy ranh giới hành chính (FeatureCollection)
        const rg = await listRanhGioi();
        const xaNames = Array.from(
          new Set(
            (rg.features || [])
              .map((f) => f.properties?.ten_xa)
              .filter(Boolean)
          )
        );

        // Hàm tiện lợi: map FeatureCollection -> mảng record kèm donvi
        const mapWithDonVi = (fc, pickPropsFn) => {
          const feats = fc.features || [];
          return feats.map((f) => {
            const base = pickPropsFn(f);
            return {
              ...base,
              donvi: guessDonViFromDiaChi(base.dia_chi, xaNames), // gắn xã/phường
            };
          });
        };

        // 2. Lấy các lớp điểm song song
        const [dl, at, ms, lt, dv] = await Promise.all([
          listDuLich(),
          listAmThuc(),
          listMuaSam(),
          listLuuTru(),
          listDichVuChung(),
        ]);

        // 3. Map dữ liệu từng lớp
        setDulich(
          mapWithDonVi(dl, (f) => ({
            gid: f.properties.gid,
            ten: f.properties.ten,
            dia_chi: f.properties.dia_chi,
            loai_hinh: f.properties.loai_hinh,
          }))
        );

        setAmthuc(
          mapWithDonVi(at, (f) => ({
            gid: f.properties.gid,
            ten: f.properties.ten,
            dia_chi: f.properties.dia_chi,
            loai_hinh: f.properties.loai_hinh,
          }))
        );

        setMuasam(
          mapWithDonVi(ms, (f) => ({
            gid: f.properties.gid,
            ten: f.properties.ten,
            dia_chi: f.properties.dia_chi,
            loai_hinh: f.properties.loai_hinh,
          }))
        );

        // Lưu trú: dùng HANG_SAO làm "loai_hinh"
        setLuutru(
          mapWithDonVi(lt, (f) => ({
            gid: f.properties.gid,
            ten: f.properties.ten,
            dia_chi: f.properties.dia_chi,
            loai_hinh: f.properties.hang_sao,
          }))
        );

        // Dịch vụ chung: dùng LOAI_DV làm "loai_hinh"
        setDichvu(
          mapWithDonVi(dv, (f) => ({
            gid: f.properties.gid,
            ten: f.properties.ten,
            dia_chi: f.properties.dia_chi,
            loai_hinh: f.properties.loai_dv,
          }))
        );
      } catch (err) {
        console.error("Lỗi tải dữ liệu tra cứu:", err);
      }
    };

    fetchAll();
  }, []);

  // ====== CHỌN DATA THEO TAB ======
  const currentData = useMemo(() => {
    switch (activeTab) {
      case "dulich":
        return dulich;
      case "amthuc":
        return amthuc;
      case "muasam":
        return muasam;
      case "luutru":
        return luutru;
      case "dichvu":
        return dichvu;
      default:
        return [];
    }
  }, [activeTab, dulich, amthuc, muasam, luutru, dichvu]);

  // Label cột loại hình: tuỳ theo tab
  const loaiColLabel = useMemo(() => {
    if (activeTab === "luutru") return "Hạng sao";
    if (activeTab === "dichvu") return "Loại dịch vụ";
    return "Loại hình";
  }, [activeTab]);

  // ====== LẤY LIST ĐƠN VỊ HÀNH CHÍNH & LOẠI HÌNH CHO DROPDOWN ======
  const donViOptions = useMemo(() => {
    const set = new Set();
    currentData.forEach((r) => {
      if (r.donvi && r.donvi !== "Không rõ") set.add(r.donvi);
    });
    return Array.from(set).sort();
  }, [currentData]);

  const loaiOptions = useMemo(() => {
    const set = new Set();
    currentData.forEach((r) => {
      if (r.loai_hinh) set.add(r.loai_hinh);
    });
    return Array.from(set).sort();
  }, [currentData]);

  // ====== ÁP DỤNG BỘ LỌC & SEARCH ======
  const filtered = useMemo(() => {
    return currentData.filter((r) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const text = `${r.ten || ""} ${r.dia_chi || ""} ${
          r.loai_hinh || ""
        }`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      if (filterDonVi !== "ALL") {
        if (r.donvi !== filterDonVi) return false;
      }

      if (filterLoai !== "ALL") {
        if (r.loai_hinh !== filterLoai) return false;
      }

      return true;
    });
  }, [currentData, search, filterDonVi, filterLoai]);

  // ====== THỐNG KÊ HEADER ======
  const stats = useMemo(() => {
    const total = currentData.length;
    const afterFilter = filtered.length;

    // Đếm số loại (loai_hinh / hang_sao / loai_dv)
    const setLoai = new Set();
    filtered.forEach((r) => {
      const lh = (r.loai_hinh || "").trim();
      if (lh) setLoai.add(lh);
    });
    const soLoaiHinh = setLoai.size;

    // Đếm số đơn vị hành chính (ten_xa) có điểm
    const setDonVi = new Set();
    filtered.forEach((r) => {
      if (r.donvi && r.donvi !== "Không rõ") setDonVi.add(r.donvi);
    });
    const soDonVi = setDonVi.size;

    const byLoaiGroup = {};
    filtered.forEach((r) => {
      const g = groupLoaiHinh(r.loai_hinh);
      byLoaiGroup[g] = (byLoaiGroup[g] || 0) + 1;
    });

    return {
      total,
      afterFilter,
      soLoaiHinh,
      soDonVi,
      byLoaiGroup,
    };
  }, [currentData, filtered]);

  // ====== EXPORT CSV (thêm BOM UTF-8 để Excel đọc đúng tiếng Việt) ======
  const handleExportCSV = () => {
    const rowsToExport = filtered.length ? filtered : currentData;

    const header = ["gid", "ten", "dia_chi", "loai_hinh", "donvi"];
    const lines = [
      header.join(","),
      ...rowsToExport.map((r) =>
        [
          r.gid,
          `"${(r.ten || "").replace(/"/g, '""')}"`,
          `"${(r.dia_chi || "").replace(/"/g, '""')}"`,
          `"${(r.loai_hinh || "").replace(/"/g, '""')}"`,
          `"${(r.donvi || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];

    const BOM = "\uFEFF";
    const csvContent = lines.join("\n");

    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const tabLabel = TABS.find((t) => t.id === activeTab)?.label || "dulich";
    a.download = `angiang_${tabLabel.replace(/\s+/g, "_").toLowerCase()}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ====== JSX ======
  return (
    <main
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background:
          "linear-gradient(180deg, #C5ECFF 0%, #FFFFFF 40%, #E7F3FF 75%, #FFFFFF 100%)",
        minHeight: "calc(100vh - 56px)",
        padding: "24px 20px 32px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 26,
          border: "1px solid #D3E3FC",
          boxShadow:
            "0 20px 40px rgba(135,206,235,0.24), 0 8px 20px rgba(15,23,42,0.08)",
          padding: 24,
        }}
      >
        {/* TIÊU ĐỀ + MÔ TẢ */}
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "#00A2E8",
              marginBottom: 4,
            }}
          >
            An Giang Tourism WebGIS
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 4,
              color: "#111827",
            }}
          >
            Tra cứu dữ liệu du lịch
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", maxWidth: 880 }}>
            Trang này tra cứu chi tiết các{" "}
            <strong>
              điểm du lịch, ẩm thực, mua sắm, lưu trú và dịch vụ khác
            </strong>{" "}
            tỉnh An Giang từ cơ sở dữ liệu WebGIS: tìm kiếm, lọc, thống kê và
            xuất dữ liệu phục vụ viết báo cáo đồ án tốt nghiệp.
          </p>
        </header>

        {/* THANH TAB 5 LOẠI DỮ LIỆU */}
        <div
          style={{
            background: "#D3E3FC",
            padding: 4,
            borderRadius: 999,
            display: "inline-flex",
            gap: 4,
            marginBottom: 20,
          }}
        >
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setFilterDonVi("ALL");
                  setFilterLoai("ALL");
                  setSearch("");
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 13,
                  cursor: "pointer",
                  background: active
                    ? "linear-gradient(135deg, #00BFFF, #0090D9)"
                    : "transparent",
                  color: active ? "#ffffff" : "#1f2937",
                  boxShadow: active
                    ? "0 4px 10px rgba(0,144,217,0.35)"
                    : "none",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* THỐNG KÊ NHANH */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <article
            style={{
              borderRadius: 16,
              padding: 14,
              background:
                "linear-gradient(135deg, #eff6ff 0%, #dbeafe 45%, #ffffff 100%)",
              border: "1px solid #bfdbfe",
            }}
          >
            <div style={{ fontSize: 12, color: "#1d4ed8", marginBottom: 4 }}>
              Tổng số bản ghi
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937" }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>
              Sau khi áp dụng bộ lọc hiện tại:{" "}
              <strong>{stats.afterFilter}</strong>
            </div>
          </article>

          <article
            style={{
              borderRadius: 16,
              padding: 14,
              background:
                "linear-gradient(135deg, #ecfeff 0%, #cffafe 45%, #ffffff 100%)",
              border: "1px solid #a5f3fc",
            }}
          >
            <div style={{ fontSize: 12, color: "#0891b2", marginBottom: 4 }}>
              Số loại{" "}
              {activeTab === "luutru" ? "hạng sao" : "loại hình / loại dịch vụ"}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937" }}>
              {stats.soLoaiHinh}
            </div>
            <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>
              Đếm theo trường{" "}
              <strong>
                {activeTab === "luutru"
                  ? "hang_sao"
                  : activeTab === "dichvu"
                  ? "loai_dv"
                  : "loai_hinh"}
              </strong>{" "}
              trong CSDL.
            </div>
          </article>

          <article
            style={{
              borderRadius: 16,
              padding: 14,
              background:
                "linear-gradient(135deg, #fef9c3 0%, #fee2e2 45%, #ffffff 100%)",
              border: "1px solid #fecaca",
            }}
          >
            <div style={{ fontSize: 12, color: "#b45309", marginBottom: 4 }}>
              Số đơn vị hành chính
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937" }}>
              {stats.soDonVi}
            </div>
            <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>
              Xã / phường / thị trấn có điểm trong CSDL (theo{" "}
              <strong>ten_xa</strong> bảng ranh giới).
            </div>
          </article>
        </section>

        {/* BỘ LỌC & NÚT EXPORT */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) auto",
            gap: 12,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {/* Ô search */}
          <div>
            <input
              type="text"
              placeholder="Tìm theo tên, địa chỉ, loại hình..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none",
                background: "#ffffff",
              }}
            />
          </div>

          {/* Lọc đơn vị hành chính */}
          <div>
            <select
              value={filterDonVi}
              onChange={(e) => setFilterDonVi(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none",
                background: "#ffffff",
              }}
            >
              <option value="ALL">Tất cả xã / phường / thị trấn</option>
              {donViOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc loại hình / hạng sao / loại dịch vụ */}
          <div>
            <select
              value={filterLoai}
              onChange={(e) => setFilterLoai(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none",
                background: "#ffffff",
              }}
            >
              <option value="ALL">
                {activeTab === "luutru"
                  ? "Tất cả hạng sao"
                  : activeTab === "dichvu"
                  ? "Tất cả loại dịch vụ"
                  : "Tất cả loại hình"}
              </option>
              {loaiOptions.map((lh) => (
                <option key={lh} value={lh}>
                  {lh}
                </option>
              ))}
            </select>
          </div>

          {/* Nút xuất CSV */}
          <div style={{ textAlign: "right" }}>
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(135deg, #00BFFF 0%, #0090D9 45%, #0074B8 100%)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0,144,217,0.35)",
              }}
            >
              ⬇ Xuất CSV
            </button>
          </div>
        </section>

        {/* BẢNG DỮ LIỆU */}
        <section
          style={{
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead
              style={{
                background: "#F3F7FF",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    width: 60,
                    borderRight: "1px solid #e5e7eb",
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  gid ▲
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    width: 260,
                    borderRight: "1px solid #e5e7eb",
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  Tên điểm
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRight: "1px solid #e5e7eb",
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  Địa chỉ
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    width: 220,
                    borderRight: "1px solid #e5e7eb",
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  {loaiColLabel}
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "8px 10px",
                    width: 120,
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 16,
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    Không có bản ghi nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={`${activeTab}-${r.gid}`}>
                  <td
                    style={{
                      padding: "6px 10px",
                      borderTop: "1px solid #f3f4f6",
                      borderRight: "1px solid #f3f4f6",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.gid}
                  </td>
                  <td
                    style={{
                      padding: "6px 10px",
                      borderTop: "1px solid #f3f4f6",
                      borderRight: "1px solid #f3f4f6",
                      fontWeight: 500,
                      color: "#111827",
                    }}
                  >
                    {r.ten}
                  </td>
                  <td
                    style={{
                      padding: "6px 10px",
                      borderTop: "1px solid #f3f4f6",
                      borderRight: "1px solid #f3f4f6",
                      color: "#4b5563",
                    }}
                  >
                    {r.dia_chi}
                    {r.donvi && r.donvi !== "Không rõ" && (
                      <span style={{ color: "#6b7280", fontSize: 11 }}>
                        {" "}
                        — {r.donvi}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "6px 10px",
                      borderTop: "1px solid #f3f4f6",
                      borderRight: "1px solid #f3f4f6",
                      color: "#4b5563",
                    }}
                  >
                    {r.loai_hinh}
                  </td>
                  <td
                    style={{
                      padding: "6px 10px",
                      borderTop: "1px solid #f3f4f6",
                      textAlign: "center",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        navigate("/map", {
                          state: { tab: activeTab, gid: r.gid },
                        })
                      }
                    >
                      Xem trên bản đồ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
