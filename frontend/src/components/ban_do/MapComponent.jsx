// src/components/ban_do/MapComponent.jsx
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import html2canvas from "html2canvas";

// Routing (vẽ đường đi)
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

import { ranhgioiApi } from "../../api/ranhgioiApi";
import { dulichApi } from "../../api/dulichApi";
import { anuongApi } from "../../api/anuongApi";
import { muasamApi } from "../../api/muasamApi";
import { luutruApi } from "../../api/luutruApi";
import { dichvuchungApi } from "../../api/dichvuchungApi";

import {
  circleStyle,
  polygonStyle,
  iconDuLich,
  iconAnUong,
  iconMuaSam,
  iconLuuTru,
  iconDichVu,
  getIconForSubtype,
} from "./BieuTuongBanDo";

import ChucNangLopBanDo from "./ChucNangLopBanDo";
import ChucNangTimDuong from "./ChucNangTimDuong";
import ChucNangTimQuanhDay from "./ChucNangTimQuanhDay";
import ChucNangTour from "./ChucNangTour";

import { fitFeatureCollection } from "../../utils/mapHelper";
import "./MapComponent.css";

const INITIAL_CENTER = [10.4, 105.2];
const INITIAL_ZOOM = 9;

/* ===== ICON GHIM CHO TUYẾN ĐƯỜNG ===== */
const ROUTE_START_ICON = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ROUTE_END_ICON = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/* ===== ICON XE DI CHUYỂN THEO TOUR (BẢN TO) ===== */
const TOUR_VEHICLE_ICON = L.divIcon({
  className: "tour-vehicle-icon",
  html: "🚐",
  iconSize: [44, 44],
  iconAnchor: [22, 22], // neo chính giữa
});

// Trường thuộc tính dùng để lọc cho từng lớp
const FILTER_FIELDS = {
  dulich: "loai_hinh",
  anuong: "loai_hinh",
  muasam: "loai_hinh",
  luutru: "hang_sao",
  dichvu: "loai_dv",
};

/** Map id tab bên TrangDuLieu -> key layer trong MapComponent */
function tabIdToLayerKey(tabId) {
  switch (tabId) {
    case "dulich":
      return "dulich";
    case "amthuc":
      return "anuong"; // Ẩm thực
    case "muasam":
      return "muasam";
    case "luutru":
      return "luutru";
    case "dichvu":
      return "dichvu";
    default:
      return null;
  }
}

/** Chuẩn hoá tên xã/phường để so sánh */
function normalizeXaName(s) {
  if (!s) return "";
  let x = s.toString().trim().toLowerCase();

  // bỏ tiền tố
  x = x.replace(/^xã\s+/i, "");
  x = x.replace(/^xa\s+/i, "");
  x = x.replace(/^phường\s+/i, "");
  x = x.replace(/^phuong\s+/i, "");
  x = x.replace(/^p\.\s*/i, "");
  x = x.replace(/^thị\s+trấn\s+/i, "");
  x = x.replace(/^thi tran\s+/i, "");
  x = x.replace(/^tt\.\s*/i, "");
  x = x.replace(/^tx\.\s*/i, "");

  // bỏ bớt khoảng trắng
  x = x.replace(/\s+/g, " ").trim();

  // bỏ dấu tiếng Việt để tránh lệch dấu
  x = x.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return x;
}

/** Chuẩn hoá text chung (tên điểm du lịch, địa danh…) để so sánh */
function normalizeText(s) {
  if (!s) return "";
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/** Tạo HTML popup chi tiết theo thuộc tính của feature */
function buildPopupHtml(feature, layerKey) {
  const p = feature?.properties || {};

  const title = p.ten || "Không có tên";
  const address =
    p.dia_chi || p.diachi || p.dia_chi_day_du || p.diachi_daydu || "";
  const typeText =
    p.loai_hinh || p.loai_dv || p.hang_sao || p.loai || p.loai_dich_vu || "";
  const desc = p.mo_ta || p.mota || "";

  const rawImg = (p.hinh_anh || p.image || p.url_anh || "").toString().trim();
  const hasImage =
    rawImg &&
    rawImg.toLowerCase() !== "null" &&
    rawImg.toLowerCase() !== "undefined";
  const imageUrl = hasImage ? rawImg : "";

  const createdAt = p.created_at || "";
  const updatedAt = p.updated_at || "";

  let layerLabel = "";
  switch (layerKey) {
    case "dulich":
      layerLabel = "Điểm du lịch";
      break;
    case "anuong":
      layerLabel = "Điểm ăn uống";
      break;
    case "muasam":
      layerLabel = "Điểm mua sắm";
      break;
    case "luutru":
      layerLabel = "Điểm lưu trú";
      break;
    case "dichvu":
      layerLabel = "Dịch vụ chung";
      break;
    default:
      layerLabel = "";
  }

  return `
    <div class="popup-card">
      <div class="popup-header">
        ${layerLabel ? `<div class="popup-badge">${layerLabel}</div>` : ""}
        <h3 class="popup-title">${title}</h3>
      </div>

      ${
        imageUrl
          ? `<div class="popup-image-wrap">
               <img
                 src="${imageUrl}"
                 alt="${title}"
                 class="popup-image"
                 onerror="this.style.display='none';"
               />
             </div>`
          : ""
      }

      <div class="popup-body">
        ${
          address
            ? `<div class="popup-row">
                 <span class="popup-label">Địa chỉ:</span>
                 <span class="popup-value">${address}</span>
               </div>`
            : ""
        }

        ${
          typeText
            ? `<div class="popup-row">
                 <span class="popup-label">Loại hình:</span>
                 <span class="popup-value">${typeText}</span>
               </div>`
            : ""
        }

        ${
          desc
            ? `<div class="popup-row">
                 <span class="popup-label">Mô tả:</span>
                 <span class="popup-value popup-desc">${desc}</span>
               </div>`
            : ""
        }

        ${
          createdAt
            ? `<div class="popup-row popup-meta">
                 <span class="popup-label">Tạo lúc:</span>
                 <span class="popup-value">${createdAt}</span>
               </div>`
            : ""
        }
        ${
          updatedAt
            ? `<div class="popup-row popup-meta">
                 <span class="popup-label">Cập nhật:</span>
                 <span class="popup-value">${updatedAt}</span>
               </div>`
            : ""
        }
      </div>
    </div>
  `;
}

export default function MapComponent({
  initialTab, // từ TrangBanDo -> TrangDuLieu
  initialSelectedGid, // gid bản ghi được chọn
}) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const routingControlRef = useRef(null);
  const nearbyOverlayRef = useRef(null);
  const tourOverlayRef = useRef(null); // overlay cho tour gợi ý
  const tourVehicleRef = useRef(null); // marker xe
  const tourAnimTimersRef = useRef([]);
  const [lang] = useState("vi");

  const [routeInfo, setRouteInfo] = useState(null);
  const [, setRoutingEnabled] = useState(false);

  // Tab: layers | search | topic
  const [activeTab, setActiveTab] = useState("layers");

  // Bật / tắt lớp
  const [visibleLayers, setVisibleLayers] = useState({
    ranhgioi: true,
    dulich: true,
    anuong: true,
    muasam: true,
    luutru: true,
    dichvu: true,
  });

  // Bộ lọc chi tiết
  const [filters, setFilters] = useState({
    dulich: "ALL",
    anuong: "ALL",
    muasam: "ALL",
    luutru: "ALL",
    dichvu: "ALL",
  });

  // Giá trị cho filter
  const [filterOptions, setFilterOptions] = useState({
    dulich: [],
    anuong: [],
    muasam: [],
    luutru: [],
    dichvu: [],
  });

  // Danh sách xã (ten_xa) để đổ datalist
  const [xaOptions, setXaOptions] = useState([]);

  // Danh sách POI cho tìm đường (và thống kê theo xã)
  const [poiList, setPoiList] = useState([]);

  // Thống kê số điểm trong xã đang chọn
  const [xaStats, setXaStats] = useState(null);

  // ===== TÌM QUANH ĐÂY =====
  const [nearbyLayerId, setNearbyLayerId] = useState("dulich");
  const [nearbyRadius, setNearbyRadius] = useState(1000);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [nearbyResults, setNearbyResults] = useState([]);
  const [shareMessage, setShareMessage] = useState("");
  const [nearbyTypeFilters, setNearbyTypeFilters] = useState({
    dulich: [],
    anuong: [],
    muasam: [],
    luutru: [],
    dichvu: [],
  });

  const [, setSelectMode] = useState(null);
  const [routeDestinationFromNearby, setRouteDestinationFromNearby] =
    useState(null);

  // TÌM KIẾM THEO TÊN XÃ/PHƯỜNG
  const [searchXa, setSearchXa] = useState("");
  const [selectedXa, setSelectedXa] = useState(null);

  // Tour đang chọn
  const [selectedTour, setSelectedTour] = useState(null);

  // Animation cho tour (xe chạy mượt)
  const tourAnimationRef = useRef({
    timerId: null,
    path: [],
    segmentIndex: 0,
    stepIndex: 0,
    stepsPerSegment: 40,
    stopMarkers: [],
  });
  const [isTourPlaying, setIsTourPlaying] = useState(false);

  // GeoJSON gốc
  const dataRef = useRef({
    ranhgioi: null,
    dulich: null,
    anuong: null,
    muasam: null,
    luutru: null,
    dichvu: null,
  });

  // Layer Leaflet
  const layerRefs = useRef({
    ranhgioi: null,
    dulich: null,
    anuong: null,
    muasam: null,
    luutru: null,
    dichvu: null,
  });

  const [dataReady, setDataReady] = useState(false);

  // đánh dấu số lần đã rebuild layer; dùng để chờ vẽ xong rồi mới flyTo điểm initial
  const [layersVersion, setLayersVersion] = useState(0);
  const [initialFocusDone, setInitialFocusDone] = useState(false);

  /* ====== HÀM ĐIỀU KHIỂN ANIMATION TOUR ====== */
  function stopTourAnimation() {
    const anim = tourAnimationRef.current;
    if (anim.timerId) {
      clearInterval(anim.timerId);
      anim.timerId = null;
    }
    anim.segmentIndex = 0;
    anim.stepIndex = 0;
    setIsTourPlaying(false);
  }

  function pauseTourAnimation() {
    const anim = tourAnimationRef.current;
    if (anim.timerId) {
      clearInterval(anim.timerId);
      anim.timerId = null;
    }
    setIsTourPlaying(false);
  }

  function startTourAnimation() {
    const anim = tourAnimationRef.current;
    const map = mapRef.current;
    const vehicle = tourVehicleRef.current;

    if (!map || !vehicle) return;
    if (!anim.path || anim.path.length === 0) return;

    // đang chạy rồi thì bỏ
    if (anim.timerId) return;

    const stepsPerSegment = anim.stepsPerSegment || 40;

    anim.timerId = setInterval(() => {
      const { path, stopMarkers } = anim;

      if (anim.segmentIndex >= path.length - 1) {
        // hết tuyến
        stopTourAnimation();
        const lastMarker = stopMarkers[stopMarkers.length - 1];
        if (lastMarker) lastMarker.openPopup();
        return;
      }

      const from = path[anim.segmentIndex]; // [lat, lng]
      const to = path[anim.segmentIndex + 1];

      const t = anim.stepIndex / stepsPerSegment;
      const lat = from[0] + (to[0] - from[0]) * t;
      const lng = from[1] + (to[1] - from[1]) * t;

      vehicle.setLatLng([lat, lng]);
      map.panTo([lat, lng], { animate: true, duration: 0.4 });

      if (anim.stepIndex >= stepsPerSegment) {
        // tới điểm dừng tiếp theo
        anim.segmentIndex += 1;
        anim.stepIndex = 0;

        const marker = stopMarkers[anim.segmentIndex];
        if (marker) marker.openPopup();
      } else {
        anim.stepIndex += 1;
      }
    }, 200); // 0.2s / bước

    setIsTourPlaying(true);
  }

  /* ====== 0. HÀM CHỤP ẢNH BẢN ĐỒ ====== */
  const handleTakeScreenshot = async () => {
    if (!mapContainerRef.current) return;

    try {
      const canvas = await html2canvas(mapContainerRef.current, {
        useCORS: true,
        logging: false,
        scale: 2,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

      link.download = `ban_do_du_lich_AnGiang_${ts}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Lỗi chụp hình bản đồ:", err);
      alert("Không chụp được ảnh bản đồ. Vui lòng thử lại.");
    }
  };

  /* ========== 1. Khởi tạo map ========== */
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        zoomAnimation: false, // tắt animation để tránh lỗi _leaflet_pos
        fadeAnimation: false,
        markerZoomAnimation: false,
      });

      // ----- Nền bản đồ đường (OSM) -----
      const osmLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
        }
      ).addTo(map); // mặc định bật

      // ----- Nền ảnh vệ tinh (Esri World Imagery) -----
      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, " +
            "Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 19,
        }
      );

      // ----- Nút chọn nền bản đồ -----
      L.control
        .layers(
          {
            "Bản đồ đường": osmLayer,
            "Ảnh vệ tinh": satelliteLayer,
          },
          null,
          { position: "topleft", collapsed: true }
        )
        .addTo(map);

      mapRef.current = map;
    } catch (err) {
      console.error("Lỗi khởi tạo Leaflet map:", err);
    }

    return () => {
      const map = mapRef.current;
      if (map) {
        // dừng mọi event & animation trước khi remove
        map.off();
        if (map.stop) {
          map.stop();
        }

        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        }
        if (nearbyOverlayRef.current) {
          nearbyOverlayRef.current.remove();
          nearbyOverlayRef.current = null;
        }
        if (tourOverlayRef.current) {
          tourOverlayRef.current.remove();
          tourOverlayRef.current = null;
        }
        if (tourVehicleRef.current) {
          tourVehicleRef.current.remove();
          tourVehicleRef.current = null;
        }
        stopTourAnimation();
        tourAnimTimersRef.current.forEach((id) => clearTimeout(id));
        tourAnimTimersRef.current = [];

        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /* ========== 2. Tải dữ liệu GeoJSON ========== */
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  const fetchAll = async () => {
    try {
      const [
        ranhGioiFC,
        duLichFC,
        anUongFC,
        muaSamFC,
        luuTruFC,
        dichVuFC,
      ] = await Promise.all([
        ranhgioiApi.getAll(),
        dulichApi.getAll(),
        anuongApi.getAll(),
        muasamApi.getAll(),
        luutruApi.getAll(),
        dichvuchungApi.getAll(),
      ]);

      dataRef.current = {
        ranhgioi: ranhGioiFC,
        dulich: duLichFC,
        anuong: anUongFC,
        muasam: muaSamFC,
        luutru: luuTruFC,
        dichvu: dichVuFC,
      };

      const getUniqueValues = (fc, field) => {
        if (!fc || !fc.features) return [];
        const s = new Set();
        fc.features.forEach((f) => {
          const v = f.properties?.[field];
          if (v !== null && v !== undefined && v.toString().trim() !== "") {
            s.add(v);
          }
        });
        return Array.from(s).sort();
      };

      setFilterOptions({
        dulich: getUniqueValues(duLichFC, "loai_hinh"),
        anuong: getUniqueValues(anUongFC, "loai_hinh"),
        muasam: getUniqueValues(muaSamFC, "loai_hinh"),
        luutru: getUniqueValues(luuTruFC, "hang_sao"),
        dichvu: getUniqueValues(dichVuFC, "loai_dv"),
      });

      // Lấy danh sách xã cho datalist
      setXaOptions(getUniqueValues(ranhGioiFC, "ten_xa"));

      // Build danh sách POI (giữ nguyên phần này của bạn)
      const buildPoiList = () => {
        const list = [];
        const addFromFC = (fc, layerKey) => {
          if (!fc || !fc.features) return;

          const subtypeField = FILTER_FIELDS[layerKey];

          fc.features.forEach((f, idx) => {
            const props = f.properties || {};
            const name =
              props.ten || props.name || `${layerKey.toUpperCase()}_${idx + 1}`;

            const geom = f.geometry;
            if (
              geom &&
              geom.type === "Point" &&
              Array.isArray(geom.coordinates)
            ) {
              const [lng, lat] = geom.coordinates;
              if (lat == null || lng == null) return;

              const subtype = subtypeField ? props[subtypeField] : undefined;
              const address =
                props.dia_chi ||
                props.diachi ||
                props.dia_chi_day_du ||
                props.diachi_daydu ||
                "";

              const xaName =
                props.ten_xa ||
                props.tenxa ||
                props.xa ||
                props.phuong ||
                props.ten_phuong ||
                "";

              list.push({
                id: `${layerKey}_${idx}`,
                name,
                layerKey,
                lat,
                lng,
                subtype,
                address,
                xaName,
              });
            }
          });
        };

        addFromFC(duLichFC, "dulich");
        addFromFC(anUongFC, "anuong");
        addFromFC(muaSamFC, "muasam");
        addFromFC(luuTruFC, "luutru");
        addFromFC(dichVuFC, "dichvu");

        return list;
      };

      setPoiList(buildPoiList());

      // ⭐ Quan trọng: fitBounds sau khi map READY, có try/catch để khỏi crash
      if (ranhGioiFC) {
        map.whenReady(() => {
          try {
            fitFeatureCollection(map, ranhGioiFC);
          } catch (e) {
            console.warn("fitFeatureCollection lỗi, giữ nguyên zoom mặc định:", e);
          }
        });
      }

      setDataReady(true);
    } catch (err) {
      console.error("Lỗi tải dữ liệu bản đồ:", err);
    }
  };

  fetchAll();
}, []);


  /* ========== 2b. TÍNH THỐNG KÊ ĐIỂM THEO XÃ ========== */
  useEffect(() => {
    if (!selectedXa) {
      setXaStats(null);
      return;
    }

    const target = normalizeXaName(selectedXa);

    const stats = {
      dulich: 0,
      anuong: 0,
      muasam: 0,
      luutru: 0,
      dichvu: 0,
    };

    poiList.forEach((poi) => {
      const xaNorm = normalizeXaName(poi.xaName || "");
      if (!xaNorm) return;

      const match =
        xaNorm === target ||
        xaNorm.includes(target) ||
        target.includes(xaNorm);

      if (!match) return;

      if (stats[poi.layerKey] !== undefined) {
        stats[poi.layerKey] += 1;
      }
    });

    setXaStats(stats);
  }, [selectedXa, poiList]);

  /* ========== 3. Vẽ / cập nhật layer ========== */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataReady) return;

    const rebuildLayer = (key) => {
      const fc = dataRef.current[key];
      if (!fc) return;

      if (layerRefs.current[key]) {
        layerRefs.current[key].remove();
        layerRefs.current[key] = null;
      }

      let layer = null;

      if (key === "ranhgioi") {
        // Ranh giới: tô đậm xã đang chọn
        layer = L.geoJSON(fc, {
          style: (feature) => {
            const base =
              typeof polygonStyle === "function"
                ? polygonStyle(feature)
                : polygonStyle;

            if (!selectedXa) return base;

            const p = feature.properties || {};
            const tenXaRaw =
              p.ten_xa ||
              p.tenxa ||
              p.ten_xp ||
              p.ten_phuong ||
              p.ten ||
              p.name ||
              "";
            const tenXaNorm = normalizeXaName(tenXaRaw);
            const targetNorm = normalizeXaName(selectedXa);

            const match =
              tenXaNorm &&
              (tenXaNorm === targetNorm ||
                tenXaNorm.includes(targetNorm) ||
                targetNorm.includes(tenXaNorm));

            if (match) {
              return {
                ...base,
                color: "#2563eb",
                weight: 3,
                fillOpacity: 0.04,
              };
            }
            return base;
          },
        });
      } else {
        // Lớp điểm
        const field = FILTER_FIELDS[key];
        const currentFilter = filters[key];

        const filterFn = (feature) => {
          const p = feature.properties || {};

          // 1) Lọc theo xã nếu có selectedXa
          if (selectedXa) {
            const tenXaRaw =
              p.ten_xa ||
              p.tenxa ||
              p.xa ||
              p.phuong ||
              p.ten_phuong ||
              "";
            const xaNorm = normalizeXaName(tenXaRaw);
            const targetNorm = normalizeXaName(selectedXa);

            if (xaNorm) {
              const match =
                xaNorm === targetNorm ||
                xaNorm.includes(targetNorm) ||
                targetNorm.includes(xaNorm);

              if (!match) return false;
            }
          }

          // 2) Lọc theo loại hình (loai_hinh / hang_sao / loai_dv)
          if (!field || !currentFilter || currentFilter === "ALL") return true;
          const v = p[field];
          return v === currentFilter;
        };

        const pointToLayer = (feature, latlng) => {
          const subtypeIcon = getIconForSubtype(key, feature);
          let marker;

          switch (key) {
            case "dulich":
              marker = L.marker(latlng, {
                icon: subtypeIcon || iconDuLich,
              });
              break;
            case "anuong":
              marker = L.marker(latlng, {
                icon: subtypeIcon || iconAnUong,
              });
              break;
            case "muasam":
              marker = L.marker(latlng, {
                icon: subtypeIcon || iconMuaSam,
              });
              break;
            case "luutru":
              marker = L.marker(latlng, {
                icon: subtypeIcon || iconLuuTru,
              });
              break;
            case "dichvu":
              marker = L.marker(latlng, {
                icon: subtypeIcon || iconDichVu,
              });
              break;
            default:
              marker = L.circleMarker(latlng, circleStyle());
          }

          const html = buildPopupHtml(feature, key);
          marker.bindPopup(html, {
            maxWidth: 320,
            className: "poi-popup",
          });

          return marker;
        };

        layer = L.geoJSON(fc, {
          filter: filterFn,
          pointToLayer,
        });
      }

      if (!layer) return;

      if (visibleLayers[key]) {
        layer.addTo(map);
      }

      layerRefs.current[key] = layer;
    };

    ["ranhgioi", "dulich", "anuong", "muasam", "luutru", "dichvu"].forEach(
      rebuildLayer
    );

    // đánh dấu đã rebuild xong 1 lượt
    setLayersVersion((v) => v + 1);
  }, [filters, visibleLayers, dataReady, selectedXa]);

  /* ========== 3b. Sau khi vẽ layer xong, nếu có initialTab + initialSelectedGid thì zoom tới điểm đó ========== */
  useEffect(() => {
    if (!dataReady || !initialSelectedGid || initialFocusDone === true) return;

    const map = mapRef.current;
    if (!map) return;

    const layerKey = tabIdToLayerKey(initialTab);
    if (!layerKey) return;

    const fc = dataRef.current[layerKey];
    if (!fc || !fc.features || fc.features.length === 0) return;

    const gidNum = Number(initialSelectedGid);

    // 1. Tìm feature theo gid
    const feature = fc.features.find((f) => {
      const g = f.properties?.gid;
      return g === initialSelectedGid || g === gidNum;
    });

    if (!feature || !feature.geometry) return;

    // 2. Fly tới feature
    const geom = feature.geometry;
    let center = null;

    if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
      const [lng, lat] = geom.coordinates;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        center = [lat, lng];
        map.flyTo(center, 16, { duration: 0.8 });
      }
    } else {
      const temp = L.geoJSON(feature);
      const bounds = temp.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
        center = bounds.getCenter();
      }
      temp.remove();
    }

    // 3. Mở popup đúng marker nếu đang có trong layerRefs
    const layer = layerRefs.current[layerKey];
    if (layer && center) {
      let foundMarker = null;
      layer.eachLayer((l) => {
        if (l.feature && l.feature.properties) {
          const g = l.feature.properties.gid;
          if (g === initialSelectedGid || g === gidNum) {
            foundMarker = l;
          }
        }
      });
      if (foundMarker && foundMarker.openPopup) {
        setTimeout(() => {
          foundMarker.openPopup();
        }, 400);
      }
    }

    setInitialFocusDone(true);
  }, [dataReady, layersVersion, initialTab, initialSelectedGid, initialFocusDone]);

  /* ========== 4. Clear tuyến đường ========== */
  const clearRoute = () => {
    const map = mapRef.current;
    if (map && routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    setRouteInfo(null);
    setRoutingEnabled(false);
  };

  /* ========== 5. Vẽ tuyến đường ========== */
  const handleRouteSubmit = (fromLatLng, toLatLng) => {
    const map = mapRef.current;
    if (!map || !fromLatLng || !toLatLng) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    setRouteInfo(null);
    setRoutingEnabled(true);

    const control = L.Routing.control({
      waypoints: [
        L.latLng(fromLatLng.lat, fromLatLng.lng),
        L.latLng(toLatLng.lat, toLatLng.lng),
      ],
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      show: false,
      collapsible: true,
      lineOptions: {
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      createMarker: (i, wp, nWps) => {
        const isStart = i === 0;
        const isEnd = i === nWps - 1;

        return L.marker(wp.latLng, {
          draggable: false,
          icon: isStart
            ? ROUTE_START_ICON
            : isEnd
            ? ROUTE_END_ICON
            : ROUTE_START_ICON,
          title: isStart ? "Điểm đi" : isEnd ? "Điểm đến" : "",
        });
      },
    })
      .on("routesfound", (e) => {
        const route = e.routes && e.routes[0];

        if (!route) {
          setRouteInfo(null);
          return;
        }

        if (route.coordinates && route.coordinates.length > 0) {
          const bounds = L.latLngBounds(route.coordinates);
          map.fitBounds(bounds, { padding: [40, 40] });
        }

        let hasFerry = false;

        if (Array.isArray(route.instructions)) {
          hasFerry = route.instructions.some((ins) => {
            const text = (ins.text || "").toLowerCase();
            const type = (ins.type || "").toLowerCase();
            return text.includes("ferry") || type.includes("ferry");
          });
        }

        if (!hasFerry && Array.isArray(route.legs)) {
          hasFerry = route.legs.some((leg) =>
            Array.isArray(leg.steps)
              ? leg.steps.some((step) => {
                  const m = (step.maneuver || {}).type || "";
                  const name = (step.name || "").toLowerCase();
                  return (
                    m.toLowerCase().includes("ferry") ||
                    name.includes("ferry")
                  );
                })
              : false
          );
        }

        if (route.summary) {
          const { totalDistance, totalTime } = route.summary;
          setRouteInfo({
            distanceMeters: totalDistance,
            durationSeconds: totalTime,
            hasFerry,
          });
        } else {
          setRouteInfo((prev) => ({
            ...(prev || {}),
            hasFerry,
          }));
        }
      })
      .on("routingerror", (err) => {
        console.error("Lỗi vẽ tuyến đường:", err);
        alert(
          "Không tìm được tuyến đường phù hợp. Vui lòng kiểm tra lại điểm A/B hoặc thử lại sau."
        );
        setRouteInfo(null);
        setRoutingEnabled(false);
      })
      .addTo(map);

    routingControlRef.current = control;
  };

  /* ========== 5b. Vẽ tuyến từ vị trí hiện tại tới 1 feature (Tìm quanh đây) ========== */
  const flyToFeature = (feature) => {
    const map = mapRef.current;
    if (!map || !feature?.geometry) return;
    const geom = feature.geometry;

    if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
      const [lng, lat] = geom.coordinates;
      if (lat == null || lng == null) return;
      map.flyTo([lat, lng], 16, { duration: 0.8 });
    } else {
      const tempLayer = L.geoJSON(feature);
      const bounds = tempLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
      tempLayer.remove();
    }
  };

  const handleRouteToFeature = (feature) => {
    const map = mapRef.current;
    if (!map || !feature?.geometry) {
      return;
    }

    let lat = null;
    let lng = null;
    if (
      feature.geometry.type === "Point" &&
      Array.isArray(feature.geometry.coordinates)
    ) {
      [lng, lat] = feature.geometry.coordinates;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      flyToFeature(feature);
      return;
    }

    if (!navigator.geolocation) {
      flyToFeature(feature);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const from = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const to = { lat, lng };
        handleRouteSubmit(from, to);
      },
      (err) => {
        console.error("Lỗi GPS khi vẽ route tới feature:", err);
        flyToFeature(feature);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /* ========== 6. HÀM HỖ TRỢ TÌM QUANH ĐÂY ========== */

  const clearNearby = () => {
    if (nearbyOverlayRef.current) {
      nearbyOverlayRef.current.remove();
      nearbyOverlayRef.current = null;
    }
    setNearbyResults([]);
    setShareMessage("");
  };

  const sharePoi = (layerId, idx) => {
    const fc = dataRef.current[layerId];
    if (!fc || !fc.features || idx == null || idx < 0) return;
    const feature = fc.features[idx];

    const name =
      feature.properties?.ten ||
      feature.properties?.name ||
      `${layerId.toUpperCase()}_${idx + 1}`;

    let lat = null;
    let lng = null;
    if (
      feature.geometry &&
      feature.geometry.type === "Point" &&
      Array.isArray(feature.geometry.coordinates)
    ) {
      [lng, lat] = feature.geometry.coordinates;
    }

    let text = name;
    if (lat != null && lng != null) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      text = `${name} - ${url}`;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setShareMessage(`Đã sao chép: ${text}`);
      } else {
        setShareMessage(text);
      }
    } catch (e) {
      console.warn("Không thể copy clipboard:", e);
      setShareMessage(text);
    }
  };

  const runNearbySearch = (centerLatLng) => {
    const map = mapRef.current;
    if (!map || !dataReady) return;

    const key = nearbyLayerId;
    const fc = dataRef.current[key];
    if (!fc || !fc.features) {
      setNearbyResults([]);
      return;
    }

    const subtypeField = FILTER_FIELDS[key];
    const activeSubtypes = nearbyTypeFilters[key] || [];

    if (nearbyOverlayRef.current) {
      nearbyOverlayRef.current.remove();
      nearbyOverlayRef.current = null;
    }

    const group = L.layerGroup();

    const circle = L.circle(centerLatLng, {
      radius: nearbyRadius,
      color: "#f97316",
      weight: 2,
      fillColor: "#fed7aa",
      fillOpacity: 0.15,
    });

    const centerMarker = L.circleMarker(centerLatLng, {
      radius: 5,
      color: "#b45309",
      weight: 2,
      fillColor: "#f97316",
      fillOpacity: 0.9,
    }).bindTooltip("Vị trí trung tâm tìm quanh đây", {
      permanent: false,
      direction: "top",
    });

    circle.addTo(group);
    centerMarker.addTo(group);

    const results = [];
    fc.features.forEach((f, idx) => {
      const geom = f.geometry;
      if (!geom || geom.type !== "Point" || !Array.isArray(geom.coordinates)) {
        return;
      }
      const [lng, lat] = geom.coordinates;
      if (lat == null || lng == null) return;

      if (subtypeField && activeSubtypes.length > 0) {
        const subtypeValue = f.properties?.[subtypeField];
        if (!activeSubtypes.includes(subtypeValue)) {
          return;
        }
      }

      const dist = map.distance(centerLatLng, L.latLng(lat, lng));
      if (dist <= nearbyRadius) {
        const ten =
          f.properties?.ten ||
          f.properties?.name ||
          `${key.toUpperCase()}_${idx + 1}`;

        const highlightMarker = L.circleMarker([lat, lng], {
          radius: 6,
          color: "#fb923c",
          weight: 2,
          fillColor: "#f97316",
          fillOpacity: 0.9,
        });
        highlightMarker.addTo(group);

        results.push({
          idx,
          feature: f,
          distance: dist,
          ten,
          layerId: key,
        });
      }
    });

    group.addTo(map);
    nearbyOverlayRef.current = group;

    results.sort((a, b) => a.distance - b.distance);
    setNearbyResults(results);
    setShareMessage("");
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e) => {
      if (!nearbyMode) return;
      runNearbySearch(e.latlng);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyMode, nearbyLayerId, nearbyRadius, dataReady, nearbyTypeFilters]);

  /* ========== 7. Toggle & filter ========== */
  const toggleLayer = (key) =>
    setVisibleLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  /* ========== 8. TÌM KIẾM THEO TÊN XÃ/PHƯỜNG ========== */
  const handleSearchXa = (keyword) => {
    const map = mapRef.current;
    const ranhGioiFC = dataRef.current.ranhgioi;
    if (!map || !dataReady || !ranhGioiFC || !ranhGioiFC.features) return;

    const raw = (keyword || "").toString();
    const trimmed = raw.trim();

    // Nếu rỗng -> bỏ lọc, fit lại toàn tỉnh
    if (!trimmed) {
      setSelectedXa(null);
      fitFeatureCollection(map, ranhGioiFC);
      return;
    }

    const q = trimmed.toLowerCase();

    const matches = ranhGioiFC.features.filter((f) => {
      const p = f.properties || {};
      const tenXa =
        p.ten_xa ||
        p.tenxa ||
        p.ten_xp ||
        p.ten_phuong ||
        p.ten ||
        p.name ||
        "";
      return tenXa.toString().toLowerCase().includes(q);
    });

    if (!matches.length) {
      alert("Không tìm thấy xã/phường phù hợp.");
      return;
    }

    const feature = matches[0];
    const p = feature.properties || {};
    const tenXaMatch =
      p.ten_xa ||
      p.tenxa ||
      p.ten_xp ||
      p.ten_phuong ||
      p.ten ||
      p.name ||
      trimmed;

    // lưu lại để lọc chi tiết các lớp điểm
    setSelectedXa(tenXaMatch);

    if (feature.geometry) {
      const temp = L.geoJSON(feature);
      const bounds = temp.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (
        feature.geometry.type === "Point" &&
        Array.isArray(feature.geometry.coordinates)
      ) {
        const [lng, lat] = feature.geometry.coordinates;
        if (lat != null && lng != null) {
          map.flyTo([lat, lng], 14, { duration: 0.8 });
        }
      }
      temp.remove();
    }
  };

  /* ========== 9. GỢI Ý TOUR – VẼ LÊN BẢN ĐỒ + XE DI CHUYỂN MƯỢT ========== */
  const handleSelectTour = (tour, options = {}) => {
    const map = mapRef.current;
    if (!map || !tour || !dataReady) return;

    const autoPlay = options.autoPlay === true;

    // Tắt route & tìm quanh đây để tránh rối
    clearRoute();
    setNearbyMode(false);
    clearNearby();

    // Dừng animation cũ
    stopTourAnimation();

    // Xoá overlay tour cũ + marker xe + các timer cũ
    if (tourOverlayRef.current) {
      tourOverlayRef.current.remove();
      tourOverlayRef.current = null;
    }
    if (tourVehicleRef.current) {
      tourVehicleRef.current.remove();
      tourVehicleRef.current = null;
    }
    tourAnimTimersRef.current.forEach((id) => clearTimeout(id));
    tourAnimTimersRef.current = [];

    const group = L.layerGroup();
    const coords = [];
    const stopMarkers = [];

    const searchLayers = ["dulich", "anuong", "muasam", "luutru", "dichvu"];
    const stops = tour.stops || [];

    // 9.1 Tìm feature cho từng điểm dừng & tạo marker chi tiết
    stops.forEach((stopName, orderIndex) => {
      const normStop = normalizeText(stopName);
      if (!normStop) return;

      let foundFeature = null;
      let foundLayerKey = null;

      for (const key of searchLayers) {
        const fc = dataRef.current[key];
        if (!fc || !fc.features) continue;

        for (const f of fc.features) {
          const p = f.properties || {};
          const ten = p.ten || p.name || "";
          if (!ten) continue;

          const normTen = normalizeText(ten);
          if (
            normTen === normStop ||
            normTen.includes(normStop) ||
            normStop.includes(normTen)
          ) {
            foundFeature = f;
            foundLayerKey = key;
            break;
          }
        }
        if (foundFeature) break;
      }

      if (!foundFeature || !foundFeature.geometry) return;
      const geom = foundFeature.geometry;
      if (geom.type !== "Point" || !Array.isArray(geom.coordinates)) return;

      const [lng, lat] = geom.coordinates;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const latLng = [lat, lng];
      coords.push(latLng);

      // chọn icon
      let icon = iconDuLich;
      if (foundLayerKey === "anuong") icon = iconAnUong;
      else if (foundLayerKey === "muasam") icon = iconMuaSam;
      else if (foundLayerKey === "luutru") icon = iconLuuTru;
      else if (foundLayerKey === "dichvu") icon = iconDichVu;

      const p = foundFeature.properties || {};
      const title = p.ten || p.name || stopName;
      const address =
        p.dia_chi || p.diachi || p.dia_chi_day_du || p.diachi_daydu || "";
      const typeText =
        p.loai_hinh ||
        p.loai_dv ||
        p.hang_sao ||
        p.loai ||
        p.loai_dich_vu ||
        "";
      const desc = p.mo_ta || p.mota || "";
      const rawImg = (p.hinh_anh || p.image || p.url_anh || "").toString().trim();
      const hasImage =
        rawImg &&
        rawImg.toLowerCase() !== "null" &&
        rawImg.toLowerCase() !== "undefined";
      const imageUrl = hasImage ? rawImg : "";

      const orderBadge = `<span class="tour-order-badge">${
        orderIndex + 1
      }</span>`;

      const popupHtml = `
        <div class="popup-card">
          <div class="popup-header">
            <div class="popup-badge">Điểm dừng tour</div>
            <h3 class="popup-title">${orderBadge} ${title}</h3>
          </div>

          ${
            imageUrl
              ? `<div class="popup-image-wrap">
                   <img
                     src="${imageUrl}"
                     alt="${title}"
                     class="popup-image"
                     onerror="this.style.display='none';"
                   />
                 </div>`
              : ""
          }

          <div class="popup-body">
            <!-- Thông tin tour -->
            <div class="popup-row">
              <span class="popup-label">Thuộc tour:</span>
              <span class="popup-value">${tour.name}</span>
            </div>
            ${
              tour.duration
                ? `<div class="popup-row">
                     <span class="popup-label">Thời lượng:</span>
                     <span class="popup-value">${tour.duration}</span>
                   </div>`
                : ""
            }
            ${
              tour.theme
                ? `<div class="popup-row">
                     <span class="popup-label">Chủ đề:</span>
                     <span class="popup-value">${tour.theme}</span>
                   </div>`
                : ""
            }

            <!-- Thông tin chi tiết điểm dừng -->
            ${
              address
                ? `<div class="popup-row">
                     <span class="popup-label">Địa chỉ:</span>
                     <span class="popup-value">${address}</span>
                   </div>`
                : ""
            }
            ${
              typeText
                ? `<div class="popup-row">
                     <span class="popup-label">Loại hình:</span>
                     <span class="popup-value">${typeText}</span>
                   </div>`
                : ""
            }
            ${
              desc
                ? `<div class="popup-row">
                     <span class="popup-label">Giới thiệu:</span>
                     <span class="popup-value popup-desc">${desc}</span>
                   </div>`
                : ""
            }
          </div>
        </div>
      `;

      const marker = L.marker(latLng, { icon });
      marker.bindPopup(popupHtml, {
        maxWidth: 340,
        className: "poi-popup",
      });

      marker.addTo(group);
      stopMarkers.push(marker);
    });

    // Vẽ Polyline nối các điểm dừng
    if (coords.length > 1) {
      const poly = L.polyline(coords, {
        color: tour.color || "#ea580c",
        weight: 4,
        opacity: 0.9,
        dashArray: "6 6",
      });
      poly.addTo(group);
    }

    // 9.2 Xe chạy mượt trên đường + mở popup từng điểm
    if (coords.length > 0) {
      const vehicleMarker = L.marker(coords[0], {
        icon: TOUR_VEHICLE_ICON,
      }).addTo(group);
      tourVehicleRef.current = vehicleMarker;

      // Thiết lập thông tin đường đi cho animation
      tourAnimationRef.current = {
        timerId: null,
        path: coords,
        segmentIndex: 0,
        stepIndex: 0,
        stepsPerSegment: 40, // chỉnh tốc độ bằng cách giảm / tăng số bước
        stopMarkers,
      };

      // Mở popup điểm đầu tiên
      if (stopMarkers[0]) {
        stopMarkers[0].openPopup();
      }

      // Chỉ tự động chạy nếu autoPlay = true (nút "Xem tour tự động")
      if (autoPlay) {
        startTourAnimation();
      }
    }

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    group.addTo(map);
    tourOverlayRef.current = group;
    setSelectedTour(tour);
  };

  /* ========== 10. Render ========== */
  return (
    <div className="map-page-hcm">
      {/* PANEL TRÁI */}
      <aside className="map-side-panel">
        <div className="map-side-header">
          <button
            className={`tab-btn ${activeTab === "layers" ? "active" : ""}`}
            onClick={() => setActiveTab("layers")}
          >
            Lớp dữ liệu
          </button>
          <button
            className={`tab-btn ${activeTab === "search" ? "active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            Tìm kiếm
          </button>
          <button
            className={`tab-btn ${activeTab === "topic" ? "active" : ""}`}
            onClick={() => setActiveTab("topic")}
          >
            Tour gợi ý
          </button>
        </div>

        <div className="map-side-scroll">
          {activeTab === "layers" && (
            <ChucNangLopBanDo
              lang={lang}
              visibleLayers={visibleLayers}
              toggleLayer={toggleLayer}
              filters={filters}
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              searchXa={searchXa}
              setSearchXa={setSearchXa}
              onSearchXa={handleSearchXa}
              selectedXa={selectedXa}
              xaOptions={xaOptions}
              xaStats={xaStats}
            />
          )}

          {activeTab === "search" && (
            <>
              <ChucNangTimDuong
                lang={lang}
                poiList={poiList}
                onRouteSubmit={handleRouteSubmit}
                routeInfo={routeInfo}
                externalDestination={routeDestinationFromNearby}
                filterOptions={filterOptions}
              />
              <ChucNangTimQuanhDay
                lang={lang}
                nearbyLayerId={nearbyLayerId}
                setNearbyLayerId={setNearbyLayerId}
                nearbyRadius={nearbyRadius}
                setNearbyRadius={setNearbyRadius}
                nearbyMode={nearbyMode}
                setNearbyMode={(next) => {
                  if (typeof next === "function") {
                    setNearbyMode((prev) => {
                      const value = next(prev);
                      if (!value) {
                        clearNearby();
                      } else {
                        setRoutingEnabled(false);
                        clearRoute();
                      }
                      return value;
                    });
                  } else {
                    const value = !!next;
                    if (!value) {
                      clearNearby();
                    } else {
                      setRoutingEnabled(false);
                      clearRoute();
                    }
                    setNearbyMode(value);
                  }
                }}
                nearbyResults={nearbyResults}
                shareMessage={shareMessage}
                flyToFeature={flyToFeature}
                sharePoi={sharePoi}
                clearNearby={clearNearby}
                setRoutingEnabled={setRoutingEnabled}
                setSelectMode={setSelectMode}
                clearRoute={clearRoute}
                routeToFeature={handleRouteToFeature}
                setRouteDestinationFromNearby={setRouteDestinationFromNearby}
                filterOptions={filterOptions}
                nearbyTypeFilters={nearbyTypeFilters}
                setNearbyTypeFilters={setNearbyTypeFilters}
              />
            </>
          )}

          {activeTab === "topic" && (
            <ChucNangTour lang={lang} onSelectTour={handleSelectTour} />
          )}
        </div>
      </aside>

      {/* BẢN ĐỒ BÊN PHẢI */}
      <section className="map-main">
        <div ref={mapContainerRef} className="map-container" />

        {/* Nút chụp ảnh bản đồ */}
        <button
          className="map-screenshot-btn"
          onClick={handleTakeScreenshot}
          title="Chụp ảnh bản đồ"
        >
          📷
        </button>

        {/* Nút tạm dừng / tiếp tục tour */}
        {selectedTour && (
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              right: "1rem",
              zIndex: 500,
              background: "#ffffff",
              borderRadius: "999px",
              boxShadow: "0 10px 25px rgba(15,23,42,0.35)",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            <span style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
              Tour: {selectedTour.name}
            </span>
            <button
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "4px 12px",
                background: isTourPlaying ? "#f97316" : "#2563eb",
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() =>
                isTourPlaying ? pauseTourAnimation() : startTourAnimation()
              }
            >
              {isTourPlaying ? "Tạm dừng" : "Tiếp tục"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
