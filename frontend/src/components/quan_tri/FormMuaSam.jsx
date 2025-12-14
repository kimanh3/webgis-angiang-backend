// src/components/quan_tri/FormMuaSam.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listMuaSam,
  getMuaSamById,
  createMuaSam,
  updateMuaSam,
  deleteMuaSam,
} from "../../api/muasamApi";

const emptyForm = {
  ten: "",
  dia_chi: "",
  gio_mo_cua: "",
  loai_hinh: "",
  mo_ta: "",
  hinh_anh: "",
  ten_xa: "",
  lat: "",
  lng: "",
};

export default function FormMuaSam() {
  const [items, setItems] = useState([]);
  const [editingGid, setEditingGid] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [message, setMessage] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

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
      minWidth: 1160,
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
    colLoai: { width: 170 },
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
    textarea: {
      width: "100%",
      minHeight: 88,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      outline: "none",
      fontSize: 13,
      fontWeight: 500,
      background: "#fff",
      resize: "vertical",
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
      const fc = await listMuaSam();
      const features = fc?.features || [];

      setItems(
        features
          .map((f) => {
            const p = f?.properties || {};
            return {
              gid: pick(p, ["gid", "id"]),
              ten: pick(p, ["ten", "name"], ""),
              dia_chi: pick(p, ["dia_chi", "diachi", "dia_chi_1"], ""),
              loai_hinh: pick(p, ["loai_hinh", "loaihinh", "type"], ""),
            };
          })
          .filter((x) => x.gid != null)
      );
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "❌ Lỗi tải danh sách điểm mua sắm.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  // ✅ options loại hình
  const typeOptions = useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      const v = String(it?.loai_hinh ?? "").trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [items]);

  // ✅ lọc
  const filteredItems = useMemo(() => {
    const q = (keyword || "").trim().toLowerCase();
    const t = (typeFilter || "ALL").trim();

    return items.filter((it) => {
      const matchType = t === "ALL" ? true : String(it?.loai_hinh ?? "").trim() === t;
      if (!matchType) return false;

      if (!q) return true;

      const s = `${it.gid ?? ""} ${it.ten ?? ""} ${it.dia_chi ?? ""} ${it.loai_hinh ?? ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [items, keyword, typeFilter]);

  // ===== CRUD =====
  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleEdit = async (gid) => {
    if (gid == null) return setMessage("❌ GID không hợp lệ.");
    setLoadingEdit(true);
    try {
      setMessage(null);
      const data = await getMuaSamById(gid);

      setEditingGid(gid);
      setForm({
        ten: pick(data, ["ten", "name"], ""),
        dia_chi: pick(data, ["dia_chi", "diachi", "dia_chi_1"], ""),
        gio_mo_cua: pick(data, ["gio_mo_cua", "giomocua", "gio"], ""),
        loai_hinh: pick(data, ["loai_hinh", "loaihinh", "type"], ""),
        mo_ta: pick(data, ["mo_ta", "mota", "description"], ""),
        hinh_anh: pick(data, ["hinh_anh", "hinhanh", "link_hinh_anh"], ""),
        ten_xa: pick(data, ["ten_xa", "xa_phuong", "xa"], ""),
        lat: data?.lat != null ? String(data.lat) : pick(data, ["y"], ""),
        lng: data?.lng != null ? String(data.lng) : pick(data, ["lng", "long", "x"], ""),
      });
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "❌ Lỗi lấy chi tiết điểm mua sắm.");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDelete = async (gid) => {
    if (!window.confirm("Xoá điểm mua sắm này?")) return;
    try {
      setMessage(null);
      await deleteMuaSam(gid);
      setMessage("✅ Đã xoá điểm mua sắm.");

      if (editingGid === gid) handleCancelEdit();
      loadList();
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "❌ Lỗi xoá điểm mua sắm.");
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
        await updateMuaSam(editingGid, payload);
        setMessage("✅ Đã cập nhật điểm mua sắm.");
      } else {
        await createMuaSam(payload);
        setMessage("✅ Đã tạo điểm mua sắm mới.");
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
        <h3 style={ui.h3}>Quản lý điểm mua sắm</h3>
        <span style={ui.hint}>(CRUD dữ liệu)</span>
      </div>

      {message && <p style={ui.message}>{message}</p>}
      {loadingEdit && <p style={ui.message}>⏳ Đang tải chi tiết...</p>}

      <div style={isMobile ? { ...ui.layout, gridTemplateColumns: "1fr" } : ui.layout}>
        {/* ===== LEFT: TABLE ===== */}
        <div style={ui.card}>
          <div style={ui.cardHeader}>
            <div style={ui.cardTitle}>Danh sách điểm mua sắm</div>
            <div style={ui.badge}>{filteredItems.length} mục</div>
          </div>

          <div style={ui.toolbar}>
            <div style={ui.searchGroup}>
              <input
                style={ui.searchInput}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên / địa chỉ / loại hình..."
              />

              <select
                style={ui.select}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                title="Lọc theo loại hình"
              >
                <option value="ALL">Tất cả loại hình</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              style={{ ...ui.ghostBtn, opacity: loadingList ? 0.7 : 1 }}
              onClick={() => {
                setKeyword("");
                setTypeFilter("ALL");
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
                  <th style={{ ...ui.th, ...ui.colLoai }}>Loại hình</th>
                  <th style={{ ...ui.th, ...ui.colActions, ...ui.thStickyRight }}>
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingList && (
                  <tr>
                    <td colSpan={5} style={{ ...ui.td, color: "#64748b" }}>
                      ⏳ Đang tải danh sách...
                    </td>
                  </tr>
                )}

                {!loadingList && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...ui.td, color: "#64748b" }}>
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

                        <td style={{ ...ui.td, ...ui.colLoai, background: bg }}>
                          <div style={ui.clamp2} title={it.loai_hinh || ""}>
                            {it.loai_hinh || "-"}
                          </div>
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
              {editingGid ? `Sửa điểm mua sắm (gid: ${editingGid})` : "Thêm điểm mua sắm mới"}
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
                placeholder="VD: Siêu thị / Cửa hàng..."
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
              Giờ mở cửa
              <input
                style={ui.input}
                value={form.gio_mo_cua}
                onChange={(e) => handleChange("gio_mo_cua", e.target.value)}
                placeholder="VD: 08:00 - 22:00"
              />
            </label>

            <label style={ui.label}>
              Loại hình
              <input
                style={ui.input}
                value={form.loai_hinh}
                onChange={(e) => handleChange("loai_hinh", e.target.value)}
                placeholder="VD: Siêu thị / Chợ / Trung tâm thương mại..."
              />
            </label>

            <label style={ui.label}>
              Mô tả
              <textarea
                style={ui.textarea}
                value={form.mo_ta}
                onChange={(e) => handleChange("mo_ta", e.target.value)}
                placeholder="Mô tả ngắn..."
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
                <button type="button" style={ui.ghostBtn} onClick={() => {
                  setEditingGid(null);
                  setForm(emptyForm);
                  setMessage(null);
                }} disabled={saving}>
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
