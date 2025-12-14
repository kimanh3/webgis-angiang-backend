// src/components/quan_tri/FormLuuTru.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listLuuTru,
  getLuuTruById,
  createLuuTru,
  updateLuuTru,
  deleteLuuTru,
} from "../../api/luutruApi";

const emptyForm = {
  ten: "",
  dia_chi: "",
  hang_sao: "",
  sdt: "",
  gia: "",
  hinh_anh: "",
  ten_xa: "",
  lat: "",
  lng: "",
};

export default function FormLuuTru() {
  const [items, setItems] = useState([]);
  const [editingGid, setEditingGid] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [message, setMessage] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [starFilter, setStarFilter] = useState("ALL");

  // ===== Helper pick key linh hoạt =====
  const pick = (obj, keys, fallback = "") => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null) return v;
    }
    return fallback;
  };

  // ===== UI styles (đồng bộ FormAnUong) =====
  const ui = {
    wrap: { width: "100%" },

    titleRow: {
      display: "flex",
      alignItems: "baseline",
      gap: 10,
      marginBottom: 10,
    },
    h3: { margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" },
    hint: { fontSize: 12, fontWeight: 600, color: "#64748b" },

    layout: {
      display: "grid",
      gridTemplateColumns: "1.7fr 1fr",
      gap: 18,
      alignItems: "start",
      marginTop: 12,
    },

    card: {
      background: "#fff",
      border: "1px solid #dbeafe",
      borderRadius: 18,
      boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
      overflow: "hidden",
    },

    cardHeader: {
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      background:
        "linear-gradient(180deg, rgba(59,130,246,0.10), rgba(255,255,255,0))",
      borderBottom: "1px solid #e5e7eb",
    },
    cardTitle: { fontWeight: 700, fontSize: 14, color: "#0f172a" },
    badge: {
      fontSize: 12,
      fontWeight: 600,
      padding: "6px 10px",
      borderRadius: 999,
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      color: "#1d4ed8",
      whiteSpace: "nowrap",
    },

    toolbar: {
      padding: "10px 14px",
      display: "flex",
      gap: 10,
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid #f1f5f9",
      background: "#fff",
      flexWrap: "wrap",
    },
    searchGroup: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flex: "1 1 520px",
      minWidth: 320,
    },
    searchInput: {
      flex: 1,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      outline: "none",
      fontSize: 13,
      fontWeight: 500,
      minWidth: 240,
    },
    select: {
      width: 220,
      maxWidth: "100%",
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      outline: "none",
      fontSize: 13,
      fontWeight: 500,
      background: "#fff",
      color: "#0f172a",
    },
    ghostBtn: {
      borderRadius: 999,
      border: "1px solid #e5e7eb",
      background: "#f1f5f9",
      color: "#0f172a",
      fontWeight: 600,
      fontSize: 12,
      padding: "9px 14px",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },

    tableWrap: {
      overflow: "auto",
      maxHeight: "70vh",
    },

    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      tableLayout: "fixed",
      minWidth: 1200,
    },

    th: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      textAlign: "left",
      fontSize: 12,
      fontWeight: 700,
      color: "#0f172a",
      background: "#f8fafc",
      padding: "12px 12px",
      borderBottom: "1px solid #e5e7eb",
      whiteSpace: "nowrap",
    },

    td: {
      fontSize: 13,
      fontWeight: 500,
      color: "#111827",
      padding: "12px 12px",
      borderBottom: "1px solid #eef2f7",
      verticalAlign: "top",
      lineHeight: 1.35,
      background: "#fff",
    },

    colId: { width: 70 },
    colTen: { width: 260 },
    colDiaChi: { width: 460 },
    colSao: { width: 140 },
    colGia: { width: 150 },
    colActions: { width: 180, textAlign: "right" },

    clamp2: {
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      textOverflow: "ellipsis",
      wordBreak: "break-word",
    },

    // ✅ Địa chỉ hiển thị FULL, tự xuống dòng
    addrFull: {
      color: "#334155",
      fontWeight: 500,
      whiteSpace: "normal",
      wordBreak: "break-word",
      overflowWrap: "anywhere",
    },

    nameText: { fontWeight: 600, color: "#0f172a" },

    actions: { display: "flex", gap: 8, justifyContent: "flex-end" },
    btnBase: {
      border: "none",
      borderRadius: 999,
      padding: "8px 12px",
      fontWeight: 700,
      fontSize: 12,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    btnEdit: {
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#fff",
      boxShadow: "0 8px 18px rgba(37,99,235,0.18)",
    },
    btnDelete: {
      background: "linear-gradient(135deg, #ef4444, #dc2626)",
      color: "#fff",
      boxShadow: "0 8px 18px rgba(239,68,68,0.14)",
    },

    thStickyRight: {
      position: "sticky",
      right: 0,
      zIndex: 3,
      background: "#f8fafc",
      boxShadow: "-10px 0 18px rgba(15,23,42,0.06)",
    },
    tdStickyRight: (bg) => ({
      position: "sticky",
      right: 0,
      zIndex: 1,
      background: bg,
      boxShadow: "-10px 0 18px rgba(15,23,42,0.04)",
    }),

    message: {
      margin: "10px 0 0",
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a",
    },

    formBody: { padding: 16 },
    label: {
      display: "block",
      margin: "10px 0 8px",
      fontSize: 12,
      fontWeight: 600,
      color: "#0f172a",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      outline: "none",
      fontSize: 13,
      fontWeight: 500,
      background: "#fff",
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    formActions: { marginTop: 14, display: "flex", gap: 10 },
    primaryBtn: {
      border: "none",
      borderRadius: 999,
      padding: "10px 14px",
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
      whiteSpace: "nowrap",
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#fff",
      boxShadow: "0 10px 22px rgba(37,99,235,0.18)",
      flex: 1,
    },
  };

  // ===== Load list =====
  const loadList = async () => {
    setLoadingList(true);
    try {
      setMessage(null);
      const fc = await listLuuTru();
      const features = fc?.features || [];

      setItems(
        features
          .map((f) => {
            const p = f?.properties || {};
            return {
              gid: pick(p, ["gid", "id"]),
              ten: pick(p, ["ten", "name"], ""),
              dia_chi: pick(p, ["dia_chi", "diachi", "dia_chi_1"], ""),
              hang_sao: pick(p, ["hang_sao", "hangsao", "star"], ""),
              gia: pick(p, ["gia", "price"], ""),
            };
          })
          .filter((x) => x.gid != null)
      );
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "❌ Lỗi tải danh sách điểm lưu trú.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  // ✅ options hạng sao
  const starOptions = useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      const v = String(it?.hang_sao ?? "").trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [items]);

  // ✅ lọc
  const filteredItems = useMemo(() => {
    const q = (keyword || "").trim().toLowerCase();
    const sFilter = (starFilter || "ALL").trim();

    return items.filter((it) => {
      const matchStar = sFilter === "ALL" ? true : String(it?.hang_sao ?? "").trim() === sFilter;
      if (!matchStar) return false;

      if (!q) return true;

      const s = `${it.gid ?? ""} ${it.ten ?? ""} ${it.dia_chi ?? ""} ${it.hang_sao ?? ""} ${it.gia ?? ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [items, keyword, starFilter]);

  // ===== CRUD =====
  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleEdit = async (gid) => {
    if (gid == null) return setMessage("❌ GID không hợp lệ.");
    setLoadingEdit(true);
    try {
      setMessage(null);
      const data = await getLuuTruById(gid);

      setEditingGid(gid);
      setForm({
        ten: pick(data, ["ten", "name"], ""),
        dia_chi: pick(data, ["dia_chi", "diachi", "dia_chi_1"], ""),
        hang_sao: pick(data, ["hang_sao", "hangsao", "star"], ""),
        sdt: pick(data, ["sdt", "phone"], ""),
        gia: pick(data, ["gia", "price"], ""),
        hinh_anh: pick(data, ["hinh_anh", "hinhanh", "link_hinh_anh"], ""),
        ten_xa: pick(data, ["ten_xa", "xa_phuong", "xa"], ""),
        lat: data?.lat != null ? String(data.lat) : pick(data, ["y"], ""),
        lng: data?.lng != null ? String(data.lng) : pick(data, ["lng", "long", "x"], ""),
      });
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "❌ Lỗi lấy chi tiết điểm lưu trú.");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDelete = async (gid) => {
    if (!window.confirm("Xoá điểm lưu trú này?")) return;
    try {
      setMessage(null);
      await deleteLuuTru(gid);
      setMessage("✅ Đã xoá điểm lưu trú.");

      if (editingGid === gid) handleCancelEdit();
      loadList();
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "❌ Lỗi xoá điểm lưu trú.");
    }
  };

  const handleCancelEdit = () => {
    setEditingGid(null);
    setForm(emptyForm);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...form,
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
      };

      if (payload.lat !== null && Number.isNaN(payload.lat)) payload.lat = null;
      if (payload.lng !== null && Number.isNaN(payload.lng)) payload.lng = null;

      if (editingGid !== null) {
        await updateLuuTru(editingGid, payload);
        setMessage("✅ Đã cập nhật điểm lưu trú.");
      } else {
        await createLuuTru(payload);
        setMessage("✅ Đã tạo điểm lưu trú mới.");
      }

      handleCancelEdit();
      loadList();
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "❌ Lỗi lưu dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1100;

  return (
    <div style={ui.wrap}>
      <div style={ui.titleRow}>
        <h3 style={ui.h3}>Quản lý điểm lưu trú</h3>
        <span style={ui.hint}>(CRUD dữ liệu)</span>
      </div>

      {message && <p style={ui.message}>{message}</p>}
      {loadingEdit && <p style={ui.message}>⏳ Đang tải chi tiết...</p>}

      <div style={isMobile ? { ...ui.layout, gridTemplateColumns: "1fr" } : ui.layout}>
        {/* ===== LEFT: TABLE ===== */}
        <div style={ui.card}>
          <div style={ui.cardHeader}>
            <div style={ui.cardTitle}>Danh sách điểm lưu trú</div>
            <div style={ui.badge}>{filteredItems.length} mục</div>
          </div>

          <div style={ui.toolbar}>
            <div style={ui.searchGroup}>
              <input
                style={ui.searchInput}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên / địa chỉ / hạng sao / giá..."
              />

              <select
                style={ui.select}
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value)}
                title="Lọc theo hạng sao"
              >
                <option value="ALL">Tất cả hạng sao</option>
                {starOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              style={{ ...ui.ghostBtn, opacity: loadingList ? 0.7 : 1 }}
              onClick={() => {
                setKeyword("");
                setStarFilter("ALL");
                loadList();
              }}
              disabled={loadingList}
            >
              {loadingList ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          <div style={ui.tableWrap}>
            <table style={ui.table}>
              <thead>
                <tr>
                  <th style={{ ...ui.th, ...ui.colId }}>gid</th>
                  <th style={{ ...ui.th, ...ui.colTen }}>Tên</th>
                  <th style={{ ...ui.th, ...ui.colDiaChi }}>Địa chỉ</th>
                  <th style={{ ...ui.th, ...ui.colSao }}>Hạng sao</th>
                  <th style={{ ...ui.th, ...ui.colGia }}>Giá</th>
                  <th style={{ ...ui.th, ...ui.colActions, ...ui.thStickyRight }}>
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingList && (
                  <tr>
                    <td colSpan={6} style={{ ...ui.td, color: "#64748b" }}>
                      ⏳ Đang tải danh sách...
                    </td>
                  </tr>
                )}

                {!loadingList && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...ui.td, color: "#64748b" }}>
                      Không có dữ liệu phù hợp bộ lọc.
                    </td>
                  </tr>
                )}

                {!loadingList &&
                  filteredItems.map((it, idx) => {
                    const bg = idx % 2 ? "#fbfdff" : "#fff";
                    const gidKey = it.gid ?? `${idx}`;

                    return (
                      <tr key={gidKey}>
                        <td style={{ ...ui.td, ...ui.colId, background: bg }}>
                          {it.gid ?? "-"}
                        </td>

                        <td style={{ ...ui.td, ...ui.colTen, background: bg }}>
                          <div style={{ ...ui.nameText, ...ui.clamp2 }} title={it.ten || ""}>
                            {it.ten || "-"}
                          </div>
                        </td>

                        <td style={{ ...ui.td, ...ui.colDiaChi, background: bg }}>
                          <div style={ui.addrFull} title={it.dia_chi || ""}>
                            {it.dia_chi || "-"}
                          </div>
                        </td>

                        <td style={{ ...ui.td, ...ui.colSao, background: bg }}>
                          {it.hang_sao || "-"}
                        </td>

                        <td style={{ ...ui.td, ...ui.colGia, background: bg }}>
                          {it.gia || "-"}
                        </td>

                        <td style={{ ...ui.td, ...ui.colActions, ...ui.tdStickyRight(bg) }}>
                          <div style={ui.actions}>
                            <button
                              type="button"
                              style={{ ...ui.btnBase, ...ui.btnEdit, opacity: saving ? 0.8 : 1 }}
                              onClick={() => handleEdit(it.gid)}
                              disabled={saving || !it.gid}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              style={{ ...ui.btnBase, ...ui.btnDelete, opacity: saving ? 0.8 : 1 }}
                              onClick={() => handleDelete(it.gid)}
                              disabled={saving || !it.gid}
                            >
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== RIGHT: FORM ===== */}
        <form style={ui.card} onSubmit={handleSubmit}>
          <div style={ui.cardHeader}>
            <div style={ui.cardTitle}>
              {editingGid ? `Sửa điểm lưu trú (gid: ${editingGid})` : "Thêm điểm lưu trú mới"}
            </div>
            <div style={ui.badge}>{editingGid ? "Đang sửa" : "Tạo mới"}</div>
          </div>

          <div style={ui.formBody}>
            <label style={ui.label}>
              Tên
              <input
                style={ui.input}
                value={form.ten}
                onChange={(e) => handleChange("ten", e.target.value)}
                required
                placeholder="VD: Khách sạn / Homestay..."
              />
            </label>

            <label style={ui.label}>
              Địa chỉ
              <input
                style={ui.input}
                value={form.dia_chi}
                onChange={(e) => handleChange("dia_chi", e.target.value)}
                placeholder="VD: 123 Đường..."
              />
            </label>

            <label style={ui.label}>
              Hạng sao
              <input
                style={ui.input}
                value={form.hang_sao}
                onChange={(e) => handleChange("hang_sao", e.target.value)}
                placeholder="VD: 1 / 2 / 3 / 4 / 5"
              />
            </label>

            <label style={ui.label}>
              Số điện thoại
              <input
                style={ui.input}
                value={form.sdt}
                onChange={(e) => handleChange("sdt", e.target.value)}
                placeholder="VD: 09xxxxxxxx"
              />
            </label>

            <label style={ui.label}>
              Giá tham khảo
              <input
                style={ui.input}
                value={form.gia}
                onChange={(e) => handleChange("gia", e.target.value)}
                placeholder="VD: 300000 - 800000"
              />
            </label>

            <label style={ui.label}>
              Link hình ảnh
              <input
                style={ui.input}
                value={form.hinh_anh}
                onChange={(e) => handleChange("hinh_anh", e.target.value)}
                placeholder="https://..."
              />
            </label>

            <label style={ui.label}>
              Xã / Phường
              <input
                style={ui.input}
                value={form.ten_xa}
                onChange={(e) => handleChange("ten_xa", e.target.value)}
                placeholder="VD: Phường..."
              />
            </label>

            <div style={ui.grid2}>
              <label style={ui.label}>
                Lat
                <input
                  style={ui.input}
                  type="number"
                  step="0.000001"
                  value={form.lat}
                  onChange={(e) => handleChange("lat", e.target.value)}
                  placeholder="10.xxxxxx"
                />
              </label>

              <label style={ui.label}>
                Lng
                <input
                  style={ui.input}
                  type="number"
                  step="0.000001"
                  value={form.lng}
                  onChange={(e) => handleChange("lng", e.target.value)}
                  placeholder="105.xxxxxx"
                />
              </label>
            </div>

            <div style={ui.formActions}>
              <button
                type="submit"
                style={{ ...ui.primaryBtn, opacity: saving ? 0.85 : 1 }}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : editingGid ? "Cập nhật" : "Thêm mới"}
              </button>

              {editingGid && (
                <button type="button" style={ui.ghostBtn} onClick={handleCancelEdit} disabled={saving}>
                  Huỷ
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
