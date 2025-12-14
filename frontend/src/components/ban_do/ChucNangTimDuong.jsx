// src/components/ban_do/ChucNangTimDuong.jsx
import React, { useState, useMemo, useEffect } from "react";
import { LANGUAGE_TEXT } from "../../constants/text_ban_do";

const LAYER_LABEL = {
  dulich: "Du lịch",
  anuong: "Ăn uống",
  muasam: "Mua sắm",
  luutru: "Lưu trú",
  dichvu: "Dịch vụ",
};

/* ===== FORMAT KHOẢNG CÁCH & THỜI GIAN ===== */
const formatDistance = (meters) => {
  if (!meters || meters <= 0) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDurationVi = (seconds) => {
  if (!seconds || seconds <= 0 || !Number.isFinite(seconds)) return "";
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} phút`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${minutes} phút`;
};

const formatDurationEn = (seconds) => {
  if (!seconds || seconds <= 0 || !Number.isFinite(seconds)) return "";
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
};

const formatDuration = (seconds, lang) =>
  lang === "vi" ? formatDurationVi(seconds) : formatDurationEn(seconds);

/* ===== QUY TẮC ĐÁNH GIÁ PHƯƠNG TIỆN ===== */
const getAvailableModes = (distanceMeters) => {
  if (!distanceMeters || distanceMeters <= 0) {
    return {
      driving: false,
      moto: false,
      transit: false,
      walking: false,
      bicycling: false,
    };
  }

  const km = distanceMeters / 1000;

  return {
    driving: true, // ô tô luôn khả dụng
    moto: km <= 200, // xe máy: tầm 200 km đổ lại
    transit: km >= 3 && km <= 300,
    walking: km <= 10,
    bicycling: km <= 60,
  };
};

/* ===== CHỌN PHƯƠNG TIỆN PHÙ HỢP NHẤT (luôn ưu tiên ô tô) ===== */
const suggestBestMode = (distanceMeters, durations) => {
  if (!distanceMeters || distanceMeters <= 0) return null;

  const dCar = durations.driving;
  if (!dCar || dCar <= 0 || !Number.isFinite(dCar)) return null;

  // Theo yêu cầu: luôn ưu tiên ô tô nếu có dữ liệu
  return "driving";
};

/* Lấy subtype của 1 POI nếu có (để lọc chi tiết) */
const getPoiSubtype = (p) =>
  p.subtype || p.loai_hinh || p.loai_dv || p.hang_sao || p.loai || "";

/* Lọc danh sách POI theo lớp + loại chi tiết */
const filterPoiByLayerSubtype = (poiList, layerKey, subtype) =>
  poiList.filter((p) => {
    if (layerKey && p.layerKey && p.layerKey !== layerKey) return false;
    if (subtype && subtype !== "ALL") {
      const st = getPoiSubtype(p);
      if (st !== subtype) return false;
    }
    return true;
  });

export default function ChucNangTimDuong({
  lang = "vi",
  poiList = [],
  onRouteSubmit, // callback: (fromLatLng, toLatLng) => void
  // routeInfo: { distanceMeters, durationSeconds, hasFerry? }
  routeInfo = null,
  // điểm đến từ panel "Tìm quanh đây"
  externalDestination = null,
  // các lựa chọn loại chi tiết cho từng lớp (giống panel Lớp bản đồ)
  filterOptions = {},
}) {
  const t = LANGUAGE_TEXT[lang] || LANGUAGE_TEXT.vi || {};

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLocatingFrom, setIsLocatingFrom] = useState(false);
  const [isLocatingTo, setIsLocatingTo] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // ===== BỘ LỌC RIÊNG CHO ĐIỂM ĐI / ĐIỂM ĐẾN =====
  const [fromLayer, setFromLayer] = useState("dulich");
  const [fromSubtype, setFromSubtype] = useState("ALL");

  const [toLayer, setToLayer] = useState("dulich");
  const [toSubtype, setToSubtype] = useState("ALL");

  const fromSubtypeOptions = filterOptions[fromLayer] || [];
  const toSubtypeOptions = filterOptions[toLayer] || [];

  // Khi nhận điểm đến từ Tìm quanh đây -> tự fill vào ô B
  useEffect(() => {
    if (!externalDestination) return;

    const feat = externalDestination.feature;
    let lat = null;
    let lng = null;

    if (feat && feat.geometry && Array.isArray(feat.geometry.coordinates)) {
      const coords = feat.geometry.coordinates;
      lng = Number(coords[0]);
      lat = Number(coords[1]);
    } else if (
      typeof externalDestination.lat === "number" &&
      typeof externalDestination.lng === "number"
    ) {
      lat = externalDestination.lat;
      lng = externalDestination.lng;
    }

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setTo(`${lat},${lng}`);
    } else if (externalDestination.name) {
      setTo(externalDestination.name);
    }
  }, [externalDestination]);

  // === Danh sách POI cho A/B sau khi lọc theo lớp + loại chi tiết ===
  const fromPois = useMemo(
    () => filterPoiByLayerSubtype(poiList, fromLayer, fromSubtype),
    [poiList, fromLayer, fromSubtype]
  );

  const toPois = useMemo(
    () => filterPoiByLayerSubtype(poiList, toLayer, toSubtype),
    [poiList, toLayer, toSubtype]
  );

  // Gom theo lớp để hiển thị optgroup
  const groupedFromPois = useMemo(() => {
    const groups = {};
    fromPois.forEach((p) => {
      const key = p.layerKey || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [fromPois]);

  const groupedToPois = useMemo(() => {
    const groups = {};
    toPois.forEach((p) => {
      const key = p.layerKey || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [toPois]);

  // Map tên POI sang "lat,lng"; nếu không tìm thấy thì giữ nguyên chuỗi gõ vào
  const resolveValue = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return "";
    const poi = poiList.find((p) => p.name === trimmed);
    if (poi) return `${poi.lat},${poi.lng}`;
    return trimmed;
  };

  // Parse "lat,lng" -> { lat, lng }
  const parseLatLng = (value) => {
    if (!value) return null;
    const parts = value.trim().split(",");
    if (parts.length !== 2) return null;
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  /* ===== NÚT 1: Vẽ đường trực tiếp trên WebGIS ===== */
  const handleDrawOnMap = () => {
    if (!from || !to) {
      alert(
        lang === "vi"
          ? "Vui lòng chọn/nhập cả điểm xuất phát và điểm đến."
          : "Please select/type both start and destination."
      );
      return;
    }

    if (typeof onRouteSubmit !== "function") {
      console.warn("onRouteSubmit không được truyền từ MapComponent.");
      return;
    }

    const fromResolved = resolveValue(from);
    const toResolved = resolveValue(to);

    const fromLatLng = parseLatLng(fromResolved);
    const toLatLng = parseLatLng(toResolved);

    if (!fromLatLng || !toLatLng) {
      alert(
        lang === "vi"
          ? "Để vẽ trên bản đồ, điểm A/B phải là tọa độ lat,lng (ví dụ: 10.5,105.2) hoặc chọn từ danh sách."
          : "To draw on the map, A/B must be coordinates lat,lng (e.g. 10.5,105.2) or chosen from the list."
      );
      return;
    }

    onRouteSubmit(fromLatLng, toLatLng);
  };

  /* ===== NÚT 2: Mở Google Maps ===== */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!from || !to) return;

    const fromResolved = resolveValue(from);
    const toResolved = resolveValue(to);

    const url = `https://www.google.com/maps/dir/${encodeURIComponent(
      fromResolved
    )}/${encodeURIComponent(toResolved)}`;

    window.open(url, "_blank");
  };

  /* ===== Lấy vị trí hiện tại (GPS) ===== */
  const getCurrentLocation = (target = "from") => {
    if (!navigator.geolocation) {
      alert(
        lang === "vi"
          ? "Trình duyệt của bạn không hỗ trợ định vị GPS."
          : "Your browser does not support GPS geolocation."
      );
      return;
    }

    if (target === "from") setIsLocatingFrom(true);
    if (target === "to") setIsLocatingTo(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        if (target === "from") setFrom(coords);
        if (target === "to") setTo(coords);

        setIsLocatingFrom(false);
        setIsLocatingTo(false);
      },
      (err) => {
        console.error("Lỗi GPS:", err);
        alert(
          lang === "vi"
            ? "Không lấy được vị trí hiện tại. Vui lòng thử lại hoặc nhập tay."
            : "Cannot get your current location. Please try again or type it manually."
        );
        setIsLocatingFrom(false);
        setIsLocatingTo(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Khi chọn POI trong dropdown
  const handleSelectPoi = (target, value) => {
    if (!value) return;

    if (value === "__current") {
      getCurrentLocation(target);
      return;
    }

    if (target === "from") setFrom(value);
    if (target === "to") setTo(value);
  };

  /* ===== Text hiển thị ===== */
  const title =
    t.routePanelTitle ||
    (lang === "vi" ? "Tìm đường di chuyển" : "Find route");

  const fromPlaceholder =
    t.routeFromPlaceholder ||
    (lang === "vi"
      ? "Điểm xuất phát (địa chỉ hoặc lat,lng)"
      : "Start point (address or lat,lng)");

  const toPlaceholder =
    t.routeToPlaceholder ||
    (lang === "vi"
      ? "Điểm đến (địa chỉ hoặc lat,lng)"
      : "Destination (address or lat,lng)");

  const btnGpsText = lang === "vi" ? "Dùng vị trí hiện tại" : "Use my location";
  const btnGpsLoading =
    lang === "vi" ? "Đang lấy GPS..." : "Getting GPS location...";

  const btnSubmitText =
    t.routeOpenOnGmaps ||
    (lang === "vi" ? "Mở trên Google Maps" : "Open in Google Maps");

  const btnDrawText =
    lang === "vi" ? "Mở trên bản đồ" : "Show on WebGIS";

  /* ===== THÔNG TIN TUYẾN ĐƯỜNG & PHƯƠNG TIỆN ===== */
  const distanceMeters = routeInfo?.distanceMeters || null;
  const drivingDuration = routeInfo?.durationSeconds || null; // OSRM (ô tô)
  const hasFerry = !!routeInfo?.hasFerry;

  const distanceLabel = distanceMeters ? formatDistance(distanceMeters) : "";

  // Ước lượng thời gian cho các phương tiện khác
  const walkingDuration = distanceMeters
    ? (distanceMeters / (4 * 1000)) * 3600
    : null; // 4 km/h
  const bicyclingDuration = distanceMeters
    ? (distanceMeters / (15 * 1000)) * 3600
    : null; // 15 km/h
  const motoDuration = distanceMeters
    ? (distanceMeters / (35 * 1000)) * 3600
    : null; // 35 km/h
  const transitDuration = distanceMeters
    ? (distanceMeters / (35 * 1000)) * 3600
    : null; // 35 km/h

  const availableModes = distanceMeters
    ? getAvailableModes(distanceMeters)
    : null;

  const suggestedMode = distanceMeters
    ? suggestBestMode(distanceMeters, {
        driving: drivingDuration,
        moto: motoDuration,
        transit: transitDuration,
        walking: walkingDuration,
        bicycling: bicyclingDuration,
      })
    : null;

  const modeLabelVi = {
    driving: "Ô tô",
    moto: "Xe máy",
    transit: "Xe buýt / tàu",
    walking: "Đi bộ",
    bicycling: "Xe đạp",
  };

  const modeLabelEn = {
    driving: "Car",
    moto: "Motorbike",
    transit: "Bus / train",
    walking: "Walk",
    bicycling: "Bicycle",
  };

  const modeLabel = lang === "vi" ? modeLabelVi : modeLabelEn;

  const modeDuration = {
    driving: drivingDuration,
    moto: motoDuration,
    transit: transitDuration,
    walking: walkingDuration,
    bicycling: bicyclingDuration,
  };

  const suggestedDuration =
    (suggestedMode && modeDuration[suggestedMode]) || drivingDuration;

  const textNotSuitable = lang === "vi" ? "Không phù hợp" : "Not suitable";

  /* ====== RENDER ====== */
  return (
    <div className="panel panel-route">
      {/* Header: Tìm kiếm + chip Tìm đường */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          🔍 {lang === "vi" ? "Tìm kiếm" : "Search"}
        </div>
        <button
          type="button"
          style={{
            borderRadius: 999,
            padding: "4px 10px",
            border: "none",
            background: "#16a34a",
            color: "#fff",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          🚗 {lang === "vi" ? "Tìm đường" : "Route"}
        </button>
      </div>

      {/* Cảnh báo có phà (nếu có) */}
      {hasFerry && (
        <div
          style={{
            fontSize: 13,
            marginBottom: 6,
            padding: "6px 8px",
            borderRadius: 8,
            background: "#FEF3C7",
            color: "#92400E",
          }}
        >
          ⚠{" "}
          {lang === "vi"
            ? "Tuyến đường này có phà đi qua."
            : "This route includes a ferry crossing."}
        </div>
      )}

      {/* Gợi ý phương tiện phù hợp nhất */}
      {distanceMeters && suggestedMode && (
        <div style={{ fontSize: 13, marginBottom: 6 }}>
          <span style={{ marginRight: 4 }}>⭐</span>
          {lang === "vi" ? "Gợi ý: " : "Suggested: "}
          <strong>
            {modeLabel[suggestedMode] || modeLabel.driving}{" "}
            {lang === "vi" ? "phù hợp nhất" : "recommended"}
          </strong>{" "}
          {suggestedDuration
            ? `(${formatDuration(suggestedDuration, lang)})`
            : null}
        </div>
      )}

      {/* Thanh tóm tắt thời gian các phương tiện */}
      {distanceMeters && (
        <div className="route-mode-summary">
          {/* Ô tô */}
          <div
            className={
              "route-mode-item" +
              (suggestedMode === "driving" ? " active" : "")
            }
          >
            <span className="route-mode-icon">🚗</span>
            <div className="route-mode-text">
              <span className="route-mode-label">{modeLabel.driving}</span>
              <span className="route-mode-time">
                {formatDuration(drivingDuration, lang)}
                {distanceLabel ? ` · ${distanceLabel}` : ""}
              </span>
            </div>
          </div>

          {/* Xe máy */}
          <div
            className={
              "route-mode-item" +
              (availableModes && !availableModes.moto ? " disabled" : "") +
              (suggestedMode === "moto" ? " active" : "")
            }
          >
            <span className="route-mode-icon">🛵</span>
            <div className="route-mode-text">
              <span className="route-mode-label">{modeLabel.moto}</span>
              <span className="route-mode-time">
                {availableModes && !availableModes.moto
                  ? textNotSuitable
                  : formatDuration(motoDuration, lang)}
              </span>
            </div>
          </div>

          {/* Xe buýt / tàu */}
          <div
            className={
              "route-mode-item" +
              (availableModes && !availableModes.transit ? " disabled" : "") +
              (suggestedMode === "transit" ? " active" : "")
            }
          >
            <span className="route-mode-icon">🚌</span>
            <div className="route-mode-text">
              <span className="route-mode-label">{modeLabel.transit}</span>
              <span className="route-mode-time">
                {availableModes && !availableModes.transit
                  ? textNotSuitable
                  : formatDuration(transitDuration, lang)}
              </span>
            </div>
          </div>

          {/* Đi bộ */}
          <div
            className={
              "route-mode-item" +
              (availableModes && !availableModes.walking ? " disabled" : "") +
              (suggestedMode === "walking" ? " active" : "")
            }
          >
            <span className="route-mode-icon">🚶‍♂️</span>
            <div className="route-mode-text">
              <span className="route-mode-label">{modeLabel.walking}</span>
              <span className="route-mode-time">
                {availableModes && !availableModes.walking
                  ? textNotSuitable
                  : formatDuration(walkingDuration, lang)}
              </span>
            </div>
          </div>

          {/* Xe đạp */}
          <div
            className={
              "route-mode-item" +
              (availableModes && !availableModes.bicycling ? " disabled" : "") +
              (suggestedMode === "bicycling" ? " active" : "")
            }
          >
            <span className="route-mode-icon">🚴‍♂️</span>
            <div className="route-mode-text">
              <span className="route-mode-label">{modeLabel.bicycling}</span>
              <span className="route-mode-time">
                {availableModes && !availableModes.bicycling
                  ? textNotSuitable
                  : formatDuration(bicyclingDuration, lang)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hướng dẫn ngắn gọn */}
      <div
        className="panel-subtitle"
        style={{ marginBottom: 8, marginTop: 6, fontSize: 12 }}
      >
        {lang === "vi" ? (
          <>
            <div>
              <strong>Bước 1:</strong> Định vị GPS hoặc nhập/chọn điểm A/B.
            </div>
            <div>
              <strong>Bước 2:</strong> Nhấn <em>“Mở trên bản đồ”</em> hoặc{" "}
              <em>“Mở trên Google Maps”</em> để xem lộ trình.
            </div>
          </>
        ) : (
          <>
            <div>
              <strong>Step 1:</strong> Use GPS or type/select start /
              destination.
            </div>
            <div>
              <strong>Step 2:</strong> Click <em>“Show on WebGIS”</em> or{" "}
              <em>“Open in Google Maps”</em> to view the route.
            </div>
          </>
        )}
      </div>

      {/* ================== FORM CHÍNH ================== */}
      <form onSubmit={handleSubmit} className="panel-form">
        {/* ==== KHỐI 1: ĐIỂM XUẤT PHÁT ==== */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            padding: "8px 8px 10px",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>📍</span>
            <span>
              {lang === "vi" ? "Điểm xuất phát" : "Start point"}
            </span>
          </div>

          {/* Loại điểm + Loại chi tiết (2 cột) */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 6,
              fontSize: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Loại điểm</label>
              <select
                value={fromLayer}
                onChange={(e) => {
                  setFromLayer(e.target.value);
                  setFromSubtype("ALL");
                }}
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              >
                <option value="dulich">Điểm du lịch</option>
                <option value="anuong">Ăn uống</option>
                <option value="muasam">Mua sắm</option>
                <option value="luutru">Lưu trú</option>
                <option value="dichvu">Dịch vụ chung</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label>Loại chi tiết</label>
              <select
                value={fromSubtype}
                onChange={(e) => setFromSubtype(e.target.value)}
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              >
                <option value="ALL">
                  {lang === "vi" ? "Tất cả" : "All"}
                </option>
                {fromSubtypeOptions.map((opt) => (
                  <option key={String(opt)} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nhập địa chỉ / lat,lng + nút GPS */}
          <div className="form-group">
            <input
              type="text"
              placeholder={fromPlaceholder}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <button
              type="button"
              className="btn-gps"
              onClick={() => getCurrentLocation("from")}
            >
              {isLocatingFrom ? btnGpsLoading : btnGpsText}
            </button>
          </div>

          {/* Dropdown chọn từ danh sách */}
          {fromPois.length > 0 && (
            <div className="form-group">
              <select
                className="panel-select"
                defaultValue=""
                onChange={(e) => handleSelectPoi("from", e.target.value)}
              >
                <option value="">
                  {lang === "vi"
                    ? "Hoặc chọn điểm xuất phát từ danh sách"
                    : "Or choose a start point from list"}
                </option>
                {currentLocation && (
                  <option value="__current">
                    📍{" "}
                    {lang === "vi"
                      ? "Vị trí của tôi (nếu đã định vị)"
                      : "My location (if located)"}
                  </option>
                )}
                {Object.entries(groupedFromPois).map(([layerKey, pois]) => (
                  <optgroup
                    key={layerKey}
                    label={LAYER_LABEL[layerKey] || layerKey}
                  >
                    {pois.map((p) => (
                      <option key={p.id} value={`${p.lat},${p.lng}`}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ==== KHỐI 2: ĐIỂM ĐẾN ==== */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            padding: "8px 8px 10px",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>🎯</span>
            <span>{lang === "vi" ? "Điểm đến" : "Destination"}</span>
          </div>

          {/* Loại điểm + Loại chi tiết */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 6,
              fontSize: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Loại điểm</label>
              <select
                value={toLayer}
                onChange={(e) => {
                  setToLayer(e.target.value);
                  setToSubtype("ALL");
                }}
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              >
                <option value="dulich">Điểm du lịch</option>
                <option value="anuong">Ăn uống</option>
                <option value="muasam">Mua sắm</option>
                <option value="luutru">Lưu trú</option>
                <option value="dichvu">Dịch vụ chung</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label>Loại chi tiết</label>
              <select
                value={toSubtype}
                onChange={(e) => setToSubtype(e.target.value)}
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              >
                <option value="ALL">
                  {lang === "vi" ? "Tất cả" : "All"}
                </option>
                {toSubtypeOptions.map((opt) => (
                  <option key={String(opt)} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Input điểm đến + GPS */}
          <div className="form-group">
            <input
              type="text"
              placeholder={toPlaceholder}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <button
              type="button"
              className="btn-gps"
              onClick={() => getCurrentLocation("to")}
            >
              {isLocatingTo ? btnGpsLoading : btnGpsText}
            </button>
          </div>

          {/* Thông báo nếu điểm đến lấy từ Tìm quanh đây */}
          {externalDestination && externalDestination.name && (
            <div
              style={{
                fontSize: 11,
                color: "#15803d",
                marginTop: -4,
                marginBottom: 6,
              }}
            >
              {lang === "vi"
                ? `Đã chọn điểm đến từ "Tìm quanh đây": `
                : `Destination from "Nearby search": `}
              <strong>{externalDestination.name}</strong>
            </div>
          )}

          {/* Dropdown chọn điểm đến từ danh sách */}
          {toPois.length > 0 && (
            <div className="form-group">
              <select
                className="panel-select"
                defaultValue=""
                onChange={(e) => handleSelectPoi("to", e.target.value)}
              >
                <option value="">
                  {lang === "vi"
                    ? "Hoặc chọn điểm đến từ danh sách"
                    : "Or choose a destination from list"}
                </option>
                {currentLocation && (
                  <option value="__current">
                    📍{" "}
                    {lang === "vi"
                      ? "Vị trí của tôi (nếu đã định vị)"
                      : "My location (if located)"}
                  </option>
                )}
                {Object.entries(groupedToPois).map(([layerKey, pois]) => (
                  <optgroup
                    key={layerKey}
                    label={LAYER_LABEL[layerKey] || layerKey}
                  >
                    {pois.map((p) => (
                      <option key={p.id} value={`${p.lat},${p.lng}`}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ==== NÚT HÀNH ĐỘNG ==== */}
        <div
          className="form-group"
          style={{ display: "flex", gap: 8, justifyContent: "space-between" }}
        >
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={handleDrawOnMap}
          >
            {btnDrawText}
          </button>
          <button type="submit" className="btn-primary" style={{ flex: 1 }}>
            {btnSubmitText}
          </button>
        </div>
      </form>
    </div>
  );
}
