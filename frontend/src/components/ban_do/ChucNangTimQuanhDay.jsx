// src/components/ban_do/ChucNangTimQuanhDay.jsx
import React, { useState } from "react";
import { LANGUAGE_TEXT } from "../../constants/text_ban_do";

/* ====== TEXT MẶC ĐỊNH (nếu LANGUAGE_TEXT chưa có đủ) ====== */
const LOCAL_TEXT = {
  vi: {
    title: "Tìm điểm dịch vụ quanh vị trí",
    step1:
      "Bước 1: Chọn loại điểm, loại chi tiết, bán kính & phương tiện.",
    step2:
      'Bước 2: Bật chế độ "Tìm quanh đây", sau đó bấm lên bản đồ để chọn vị trí trung tâm.',
    typeLabel: "Loại dịch vụ:",
    subTypeLabel: "Loại chi tiết:",
    radiusLabel: "Bán kính (km):",
    layerOptions: {
      dulich: "Điểm du lịch",
      anuong: "Ăn uống",
      muasam: "Mua sắm",
      luutru: "Lưu trú",
      dichvu: "Dịch vụ chung", // key = dichvu để trùng MapComponent
    },
    toggleOn: "Đang bật chế độ tìm quanh đây",
    toggleOff: "Tìm quanh đây",
    hint: "Bấm lên bản đồ để chọn vị trí trung tâm. Hệ thống sẽ tìm các điểm trong bán kính đã chọn.",
    resultLabel: "Kết quả:",
    resultUnit: "điểm",
    distanceLabel: "Khoảng cách",
    shareBtn: "Chia sẻ",
    routeBtn: "Tìm đường",

    // ==== BÀI TOÁN THEO PHƯƠNG TIỆN ====
    transportTitle: "Phương tiện di chuyển",
    transportDesc:
      'Chọn phương tiện. Khi bật "Tìm quanh đây", kết quả sẽ hiển thị để bạn tham khảo với phương tiện này.',
    transportModes: {
      walk: "Đi bộ",
      bike: "Xe đạp",
      moto: "Xe máy",
      car: "Ô tô",
    },
    transportNotes: {
      walk: "Đi bộ phù hợp khi di chuyển gần, khoảng 1–3 km.",
      bike: "Xe đạp đi xa hơn một chút, khoảng 3–8 km.",
      moto: "Xe máy di chuyển linh hoạt, 3–10 km.",
      car: "Ô tô phù hợp khi di chuyển xa, trên 5 km.",
    },
  },
  en: {
    title: "Find nearby places",
    step1:
      "Step 1: Choose category, subtype, radius & transport mode.",
    step2:
      'Step 2: Turn "Nearby mode" ON, then click on the map to choose a center location.',
    typeLabel: "Place type:",
    subTypeLabel: "Sub type:",
    radiusLabel: "Radius (km):",
    layerOptions: {
      dulich: "Tourist attractions",
      anuong: "Food & drink",
      muasam: "Shopping",
      luutru: "Accommodation",
      dichvu: "Services",
    },
    toggleOn: "Nearby mode is ON",
    toggleOff: "Search nearby",
    hint: "Click on the map to choose the center location. The system will search for places within the selected radius.",
    resultLabel: "Results:",
    resultUnit: "places",
    distanceLabel: "Distance",
    shareBtn: "Share",
    routeBtn: "Directions",

    // ==== TRANSPORT SCENARIO ====
    transportTitle: "Transport mode",
    transportDesc:
      'Choose a transport mode. When "Nearby mode" is ON, the results help you decide where to go with this mode.',
    transportModes: {
      walk: "Walking",
      bike: "Bicycle",
      moto: "Motorbike",
      car: "Car",
    },
    transportNotes: {
      walk: "Walking is usually comfortable within 1–3 km.",
      bike: "With a bicycle, you can go a bit further, about 3–8 km.",
      moto: "Motorbikes are flexible for 3–10 km.",
      car: "Cars are suitable for longer distances, above 5 km.",
    },
  },
};

export default function ChucNangTimQuanhDay({
  lang = "vi",

  // ==== state & handler do MapComponent truyền xuống ====
  nearbyLayerId,
  setNearbyLayerId,
  nearbyRadius,
  setNearbyRadius,
  nearbyMode,
  setNearbyMode,
  nearbyResults = [],
  shareMessage,

  flyToFeature,
  sharePoi,
  clearNearby,
  setRoutingEnabled,
  setSelectMode,
  clearRoute,

  // vẽ route trực tiếp (nếu có)
  routeToFeature,

  // báo cho panel Tìm đường biết điểm đến được chọn từ Nearby
  setRouteDestinationFromNearby,

  // ====== LỌC CHI TIẾT (giống hình 2) ======
  filterOptions = {},
  nearbyTypeFilters,
  setNearbyTypeFilters,
}) {
  const langKey = lang === "en" ? "en" : "vi";

  const tFromConst = LANGUAGE_TEXT?.[langKey] || {};
  const T = LOCAL_TEXT[langKey];
  const title = tFromConst.nearPanelTitle || T.title;

  const formatDistance = (d) =>
    d < 1000 ? `${d.toFixed(0)} m` : `${(d / 1000).toFixed(2)} km`;

  const safeSetNearbyLayerId = setNearbyLayerId || (() => {});
  const safeSetNearbyRadius = setNearbyRadius || (() => {});
  const safeSetNearbyMode = setNearbyMode || (() => {});
  const safeClearNearby = clearNearby || (() => {});
  const safeSetRoutingEnabled = setRoutingEnabled || (() => {});
  const safeSetSelectMode = setSelectMode || (() => {});
  const safeClearRoute = clearRoute || (() => {});
  const safeFlyToFeature = flyToFeature || (() => {});
  const safeSharePoi = sharePoi || (() => {});
  const safeRouteToFeature = routeToFeature || (() => {});
  const safeSetRouteDestinationFromNearby =
    setRouteDestinationFromNearby || (() => {});

  const safeNearbyTypeFilters = nearbyTypeFilters || {};
  const safeSetNearbyTypeFilters = setNearbyTypeFilters || (() => {});

  const currentRadius = nearbyRadius ?? 1000;
  const currentLayerId = nearbyLayerId || "dulich";
  const isNearbyOn = !!nearbyMode;

  // ===== state nội bộ cho phương tiện =====
  const [transportMode, setTransportMode] = useState("walk"); // walk | bike | moto | car

  // ===== dữ liệu lọc chi tiết cho lớp đang chọn =====
  const currentSubtypeOptions = filterOptions[currentLayerId] || [];
  const selectedSubtypes = safeNearbyTypeFilters[currentLayerId] || [];
  const isAllSubtypes = selectedSubtypes.length === 0;

  const handleChangeAllSubtypes = (checked) => {
    if (!checked) return; // "Tất cả" chỉ có ý nghĩa khi bật
    safeSetNearbyTypeFilters((prev) => ({
      ...prev,
      [currentLayerId]: [],
    }));
  };

  const handleToggleSubtype = (value, checked) => {
    safeSetNearbyTypeFilters((prev) => {
      const oldArr = prev?.[currentLayerId] || [];
      let nextArr;
      if (checked) {
        if (oldArr.includes(value)) return prev;
        nextArr = [...oldArr, value];
      } else {
        nextArr = oldArr.filter((v) => v !== value);
      }
      return {
        ...prev,
        [currentLayerId]: nextArr,
      };
    });
  };

  return (
    <div className="panel panel-nearby">
      {/* HEADER: Tìm kiếm + chip Tìm quanh đây */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          🔍 {title}
        </div>
        <button
          type="button"
          style={{
            borderRadius: 999,
            padding: "4px 10px",
            border: "none",
            background: "#ea580c",
            color: "#fff",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          📍 {langKey === "vi" ? "Tìm quanh đây" : "Nearby"}
        </button>
      </div>

      {/* HƯỚNG DẪN BƯỚC 1, 2 */}
      <div
        style={{
          fontSize: 12,
          color: "#92400e",
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        <div>
          <strong>{langKey === "vi" ? "Bước 1:" : "Step 1:"}</strong>{" "}
          {T.step1.replace(/^Bước 1:\s*/i, "").replace(/^Step 1:\s*/i, "")}
        </div>
        <div>
          <strong>{langKey === "vi" ? "Bước 2:" : "Step 2:"}</strong>{" "}
          {T.step2.replace(/^Bước 2:\s*/i, "").replace(/^Step 2:\s*/i, "")}
        </div>
      </div>

      {/* CARD: Loại, loại chi tiết, bán kính, phương tiện + nút bật tìm quanh đây */}
      <div
        style={{
          display: "grid",
          gap: 8,
          marginBottom: 8,
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          padding: "8px 8px 10px",
        }}
      >
        {/* Loại dịch vụ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13 }}>{T.typeLabel}</div>
          <select
            value={currentLayerId}
            onChange={(e) => {
              const nextLayer = e.target.value;
              safeSetNearbyLayerId(nextLayer);
            }}
            className="select-basic"
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #fed7aa",
              fontSize: 13,
            }}
          >
            <option value="dulich">{T.layerOptions.dulich}</option>
            <option value="anuong">{T.layerOptions.anuong}</option>
            <option value="muasam">{T.layerOptions.muasam}</option>
            <option value="luutru">{T.layerOptions.luutru}</option>
            <option value="dichvu">{T.layerOptions.dichvu}</option>
          </select>
        </div>

        {/* LỌC LOẠI CHI TIẾT */}
        {currentSubtypeOptions.length > 0 && (
          <div
            style={{
              borderRadius: 8,
              border: "1px solid #fee2e2",
              padding: "6px 8px",
              background: "#fff7ed",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {T.subTypeLabel}
            </div>

            <div style={{ display: "grid", gap: 2 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={isAllSubtypes}
                  onChange={(e) => handleChangeAllSubtypes(e.target.checked)}
                />
                {langKey === "vi" ? "Tất cả" : "All"}
              </label>

              {currentSubtypeOptions.map((opt) => (
                <label
                  key={String(opt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubtypes.includes(opt)}
                    onChange={(e) =>
                      handleToggleSubtype(opt, e.target.checked)
                    }
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Bán kính (km, nhưng value = mét) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13 }}>{T.radiusLabel}</div>
          <select
            value={currentRadius}
            onChange={(e) => safeSetNearbyRadius(Number(e.target.value))}
            className="select-basic"
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #fed7aa",
              fontSize: 13,
            }}
          >
            <option value={500}>0.5 km</option>
            <option value={1000}>1 km</option>
            <option value={2000}>2 km</option>
            <option value={3000}>3 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
          </select>
        </div>

        {/* KHỐI PHƯƠNG TIỆN DI CHUYỂN */}
        <div
          style={{
            marginTop: 4,
            padding: "6px 8px",
            borderRadius: 8,
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {T.transportTitle}
          </div>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            {T.transportDesc}
          </div>

          {/* chọn phương tiện */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 6,
            }}
          >
            {["walk", "bike", "moto", "car"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTransportMode(mode)}
                style={{
                  flex: "0 0 auto",
                  padding: "4px 8px",
                  borderRadius: 999,
                  border:
                    transportMode === mode
                      ? "1px solid #2563eb"
                      : "1px solid #dbeafe",
                  fontSize: 11,
                  cursor: "pointer",
                  background:
                    transportMode === mode ? "#2563eb" : "rgba(255,255,255,0.9)",
                  color: transportMode === mode ? "#fff" : "#1e293b",
                }}
              >
                {T.transportModes[mode]}
              </button>
            ))}
          </div>

          {/* note ngắn cho phương tiện đang chọn */}
          <div
            style={{
              fontSize: 11,
              marginBottom: 2,
              color: "#1e3a8a",
            }}
          >
            {T.transportNotes[transportMode]}
          </div>
        </div>

        {/* Nút bật / tắt chế độ tìm quanh đây */}
        <button
          type="button"
          className="btn-primary"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            background: isNearbyOn ? "#f97316" : "#ea580c",
            color: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
          onClick={() => {
            safeSetNearbyMode((on) => {
              const next = !on;
              if (!next) {
                safeClearNearby();
              } else {
                // bật mode → tắt routing
                safeSetRoutingEnabled(false);
                safeSetSelectMode && safeSetSelectMode("nearby");
                safeClearRoute();
              }
              return next;
            });
          }}
        >
          {isNearbyOn ? T.toggleOn : T.toggleOff}
        </button>
      </div>

      {/* GỢI Ý SỬ DỤNG */}
      {isNearbyOn && (
        <div
          style={{
            fontSize: 12,
            color: "#92400e",
            marginBottom: 6,
            background: "#fffbeb",
            borderRadius: 6,
            padding: "6px 8px",
            border: "1px dashed #fed7aa",
          }}
        >
          {T.hint}
        </div>
      )}

      {/* DANH SÁCH KẾT QUẢ */}
      {nearbyResults.length > 0 && (
        <div
          style={{
            marginTop: 4,
            maxHeight: 170,
            overflowY: "auto",
            borderTop: "1px solid #fed7aa",
            paddingTop: 4,
          }}
        >
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            {T.resultLabel} <strong>{nearbyResults.length}</strong>{" "}
            {T.resultUnit}
          </div>

          {nearbyResults.map((r, i) => (
            <div
              key={`${r.idx ?? i}-${i}`}
              className="nearby-result-item"
              style={{
                fontSize: 12,
                padding: "4px 6px",
                borderRadius: 6,
                border: "1px solid #fee2e2",
                marginBottom: 4,
                cursor: "pointer",
                background: "#fff7ed",
              }}
              onClick={() => safeFlyToFeature(r.feature)}
            >
              <div style={{ fontWeight: 600 }}>{r.ten || r.name}</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 2,
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  {T.distanceLabel}:{" "}
                  {r.distance != null ? formatDistance(r.distance) : "---"}
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap",
                  }}
                >
                  {/* CHIA SẺ */}
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      padding: "2px 6px",
                      fontSize: 11,
                      borderRadius: 999,
                      border: "none",
                      background: "#0ea5e9",
                      color: "#fff",
                      cursor: "pointer",
                      boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      safeSharePoi(r.layerId, r.idx);
                    }}
                  >
                    {T.shareBtn}
                  </button>

                  {/* NÚT TÌM ĐƯỜNG */}
                  <button
                    type="button"
                    style={{
                      padding: "2px 6px",
                      fontSize: 11,
                      borderRadius: 999,
                      border: "none",
                      background: "#22c55e",
                      color: "#fff",
                      cursor: "pointer",
                      boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // bật chế độ routing, xóa tuyến cũ, zoom vào điểm
                      safeSetRoutingEnabled(true);
                      safeSetSelectMode && safeSetSelectMode(null);
                      safeClearRoute();
                      safeFlyToFeature(r.feature);
                      safeRouteToFeature(r.feature);

                      // gửi thông tin điểm đến lên panel Tìm đường
                      safeSetRouteDestinationFromNearby({
                        name: r.ten || r.name,
                        feature: r.feature,
                        layerId: r.layerId,
                      });
                    }}
                  >
                    {T.routeBtn}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* THÔNG BÁO SAU KHI CHIA SẺ */}
      {shareMessage && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#166534",
          }}
        >
          {shareMessage}
        </div>
      )}
    </div>
  );
}
