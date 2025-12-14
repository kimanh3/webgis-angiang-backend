// src/components/ban_do/ChucNangLopBanDo.jsx
import React, { useCallback } from "react";
import { LANGUAGE_TEXT } from "../../constants/text_ban_do";

const LAYER_LABELS = {
  ranhgioi: "Ranh giới hành chính",
  dulich: "Điểm du lịch",
  anuong: "Ăn uống",
  muasam: "Mua sắm",
  luutru: "Lưu trú",
  dichvu: "Dịch vụ chung",
};

export default function ChucNangLopBanDo({
  lang = "vi",
  visibleLayers = {},
  toggleLayer,
  filters = {},
  filterOptions = {},
  onFilterChange,
  // tìm theo tên xã/phường
  searchXa = "",
  setSearchXa,
  onSearchXa,
  // xã hiện đang được lọc chi tiết (đã tìm ra)
  selectedXa,
  // danh sách xã lấy từ lớp ranh giới (đổ vào datalist)
  xaOptions = [],
  // thống kê số điểm trong xã (dulich / anuong / muasam / luutru / dichvu)
  xaStats = null,
}) {
  const t = LANGUAGE_TEXT[lang] || LANGUAGE_TEXT.vi;

  // Nhóm các lớp điểm: du lịch – ẩm thực – dịch vụ
  const groupKeys = ["dulich", "anuong", "muasam", "luutru", "dichvu"];

  const handleGroupToggle = () => {
    const allOn = groupKeys.every((k) => visibleLayers[k]);
    if (allOn) {
      // Tắt hết
      groupKeys.forEach((k) => {
        if (visibleLayers[k]) toggleLayer(k);
      });
    } else {
      // Bật hết
      groupKeys.forEach((k) => {
        if (!visibleLayers[k]) toggleLayer(k);
      });
    }
  };

  // ====== TÌM KIẾM THEO TÊN XÃ/PHƯỜNG ======
  const handleSearchSubmit = useCallback(() => {
    if (!searchXa.trim()) return;

    // 1. Gửi lên MapComponent để lọc theo xã/phường
    if (onSearchXa) onSearchXa(searchXa);

    // 2. Tự động bật các lớp điểm để điểm trong xã hiển thị luôn
    if (toggleLayer) {
      ["dulich", "anuong", "muasam", "luutru", "dichvu"].forEach((key) => {
        if (!visibleLayers[key]) {
          toggleLayer(key);
        }
      });
    }
  }, [onSearchXa, searchXa, toggleLayer, visibleLayers]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const handleSearchChange = (e) => {
    if (setSearchXa) setSearchXa(e.target.value);
  };

  // Hiển thị checkbox con (lọc loại hình) cho từng lớp
  const renderFilterCheckboxes = (layerKey) => {
    const options = filterOptions[layerKey] || [];
    if (!options.length || !onFilterChange) return null;

    const current = filters[layerKey] || "ALL";

    const handleClick = (value) => {
      // Click lại đúng loại đang chọn -> quay về "Tất cả"
      const next = current === value ? "ALL" : value;
      onFilterChange(layerKey, next);
    };

    return (
      <ul className="layer-filter-options">
        {/* Hàng "Tất cả" */}
        <li>
          <label className="layer-item layer-item-small">
            <input
              type="checkbox"
              checked={current === "ALL"}
              onChange={() => onFilterChange(layerKey, "ALL")}
            />
            <span>Tất cả</span>
          </label>
        </li>

        {/* Các loại cụ thể: Quán ăn, Quán nước, ... */}
        {options.map((opt) => (
          <li key={opt}>
            <label className="layer-item layer-item-small">
              <input
                type="checkbox"
                checked={current === opt}
                onChange={() => handleClick(opt)}
              />
              <span>{opt}</span>
            </label>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="panel panel-layers">
      {/* Tiêu đề & mô tả */}
      <h3>{t.layersPanelTitle}</h3>
      <p className="panel-subtitle">{t.layersPanelSubtitle}</p>

      {/* Ô TÌM / CHỌN XÃ, PHƯỜNG – thanh search đẹp */}
      <div className="layer-search-header">
        <div className="layer-search-input-wrap">
          <span className="layer-search-icon">📍</span>
          <input
            list="danh-sach-xa"
            type="text"
            className="layer-search-input"
            placeholder="Nhập / chọn xã, phường… (vd: Châu Phú)"
            value={searchXa}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
          <datalist id="danh-sach-xa">
            {xaOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <button
          type="button"
          className="layer-search-btn"
          onClick={handleSearchSubmit}
          title="Tìm theo tên xã / phường"
        >
          🔍
        </button>
      </div>

      <div className="layer-search-hint">
        {selectedXa ? (
          <>
            Đang lọc theo xã / phường: <strong>{selectedXa}</strong>. Xoá nội
            dung ô tìm kiếm hoặc gõ/chọn tên khác để đổi khu vực.
          </>
        ) : (
          <>Bạn có thể gõ hoặc chọn tên xã/phường để xem dữ liệu theo khu vực.</>
        )}
      </div>

      {/* THỐNG KÊ SỐ ĐIỂM TRONG XÃ/PHƯỜNG */}
      {selectedXa && xaStats && (
        <div className="layer-xa-stats">
          <div className="layer-xa-stats-title">
            Các điểm trong xã / phường <strong>{selectedXa}</strong>:
          </div>
          <ul className="layer-xa-stats-list">
            <li>
              Điểm du lịch: <strong>{xaStats.dulich || 0}</strong>
            </li>
            <li>
              Ăn uống: <strong>{xaStats.anuong || 0}</strong>
            </li>
            <li>
              Mua sắm: <strong>{xaStats.muasam || 0}</strong>
            </li>
            <li>
              Lưu trú: <strong>{xaStats.luutru || 0}</strong>
            </li>
            <li>
              Dịch vụ chung: <strong>{xaStats.dichvu || 0}</strong>
            </li>
          </ul>
        </div>
      )}

      {/* Cây lớp dữ liệu + lọc chi tiết từng lớp */}
      <div className="layer-tree">
        {/* Lớp ranh giới hành chính */}
        <label className="layer-item root">
          <input
            type="checkbox"
            checked={!!visibleLayers.ranhgioi}
            onChange={() => toggleLayer("ranhgioi")}
          />
          <span className="layer-label">{LAYER_LABELS.ranhgioi}</span>
        </label>

        {/* Nhóm Du lịch – Ẩm thực – Dịch vụ */}
        <details open className="layer-group">
          <summary>
            <label>
              <input
                type="checkbox"
                checked={groupKeys.every((k) => visibleLayers[k])}
                onChange={handleGroupToggle}
              />
              <span className="layer-label">
                Du lịch – Ẩm thực – Dịch vụ
              </span>
            </label>
          </summary>

          <ul className="layer-group-children">
            {groupKeys.map((key) => (
              <li key={key}>
                <div className="layer-item-with-filter">
                  {/* Checkbox bật/tắt lớp */}
                  <label className="layer-item">
                    <input
                      type="checkbox"
                      checked={!!visibleLayers[key]}
                      onChange={() => toggleLayer(key)}
                    />
                    <span className="layer-label">{LAYER_LABELS[key]}</span>
                  </label>

                  {/* Lọc loại hình trong từng lớp */}
                  {renderFilterCheckboxes(key)}
                </div>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
