// src/components/ban_do/BieuTuongBanDo.js
import L from "leaflet";
import palette, { LAYER_COLORS } from "../../constants/mau_sac";

// Đặt alias cho default export từ mau_sac.js
const COLORS = palette;

// Bán kính marker dạng circleMarker (nếu có dùng)
export const POINT_RADIUS = 8;

// Style cho các điểm (circleMarker), tuỳ theo key lớp
export const circleStyle = (layerKey = "default") => ({
  radius: POINT_RADIUS,
  fillColor: LAYER_COLORS?.[layerKey] || COLORS.primary,
  color: "#ffffff",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.9,
});

// Style cho đường (nếu sau này cần vẽ polyline)
export const lineStyle = {
  color: COLORS.border,
  weight: 2,
  opacity: 0.8,
};

// ⭐ Style cho polygon ranh giới – MỚI:
//   - Viền xanh dương nhẹ
//   - Nền xanh rất nhạt, trong suốt → không lấn át icon
export const polygonStyle = () => ({
  color: "#2563eb",      // viền xanh dương
  weight: 1.5,
  opacity: 0.8,
  dashArray: "3",        // gạch nhẹ cho giống ranh giới hành chính
  fillColor: "#dbeafe",  // xanh rất nhạt
  fillOpacity: 0.15,
});

/* ======================================================
   ICON “MAP PIN” (GIỌT NƯỚC)
   - Nền gradient, viền trắng, bóng đổ
   - Emoji ở giữa
====================================================== */

function createPinIcon(emoji, colorFrom = "#ff7a18", colorTo = "#ff4800") {
  return L.divIcon({
    className: "emoji-marker",
    html: `
      <div style="
        width: 32px;
        height: 42px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(180deg, ${colorFrom}, ${colorTo});
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 16px;
        ">
          ${emoji}
        </div>

        <div style="
          width: 0;
          height: 0;
          border-left: 9px solid transparent;
          border-right: 9px solid transparent;
          border-top: 12px solid ${colorTo};
          position: absolute;
          bottom: -9px;
          left: 50%;
          transform: translateX(-50%);
        "></div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
}

/**
 * Emoji “trần” (ít dùng, nhưng giữ lại nếu muốn dùng chỗ khác)
 */
export function createEmojiIcon(emoji) {
  return L.divIcon({
    className: "emoji-marker",
    html: `<div style="font-size:20px; line-height:1;">${emoji}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/* ====== HÀM TIỆN ÍCH ====== */

function normalize(str) {
  if (!str) return "";
  return str.toString().toLowerCase();
}

/**
 * Icon chi tiết cho từng loại trong từng lớp.
 * Mapping bám theo đúng các checkbox trong panel.
 */
export function getIconForSubtype(layerKey, feature) {
  const p = feature?.properties || {};

  const loaiHinh = normalize(p.loai_hinh);
  const loaiDv = normalize(p.loai_dv);
  const hangSao = normalize(p.hang_sao);

  /* ==========================
     DU LỊCH (loai_hinh)
  ========================== */
  if (layerKey === "dulich") {
    // Du lịch cộng đồng – làng nghề
    if (
      loaiHinh.includes("cộng đồng") ||
      loaiHinh.includes("cong dong") ||
      loaiHinh.includes("làng nghề") ||
      loaiHinh.includes("lang nghe")
    ) {
      return createPinIcon("🧑‍🌾", "#4ade80", "#16a34a");
    }

    // Du lịch nghỉ dưỡng – giải trí
    if (
      loaiHinh.includes("nghỉ dưỡng") ||
      loaiHinh.includes("nghi duong") ||
      loaiHinh.includes("giải trí") ||
      loaiHinh.includes("giai tri")
    ) {
      return createPinIcon("🏖️", "#fed7aa", "#f97316");
    }

    // Du lịch tâm linh – tín ngưỡng
    if (
      loaiHinh.includes("tâm linh") ||
      loaiHinh.includes("tam linh") ||
      loaiHinh.includes("tín ngưỡng") ||
      loaiHinh.includes("tin nguong")
    ) {
      return createPinIcon("🛕", "#a5b4fc", "#6366f1");
    }

    // Du lịch tự nhiên – sinh thái
    if (
      loaiHinh.includes("tự nhiên") ||
      loaiHinh.includes("tu nhien") ||
      loaiHinh.includes("sinh thái") ||
      loaiHinh.includes("sinh thai")
    ) {
      return createPinIcon("🌿", "#bbf7d0", "#22c55e");
    }

    // Du lịch văn hóa – lịch sử
    if (
      loaiHinh.includes("văn hóa") ||
      loaiHinh.includes("van hoa") ||
      loaiHinh.includes("lịch sử") ||
      loaiHinh.includes("lich su")
    ) {
      return createPinIcon("🏛️", "#7dd3fc", "#0ea5e9");
    }

    // fallback du lịch (Tất cả)
    return createPinIcon("📍", "#bfdbfe", "#2563eb");
  }

  /* ==========================
     ĂN UỐNG (loai_hinh)
  ========================== */
  if (layerKey === "anuong") {
    // Quán nước / café / trà sữa
    if (
      loaiHinh.includes("quán nước") ||
      loaiHinh.includes("quan nuoc") ||
      loaiHinh.includes("cafe") ||
      loaiHinh.includes("café") ||
      loaiHinh.includes("trà sữa") ||
      loaiHinh.includes("tra sua")
    ) {
      return createPinIcon("🧋", "#7dd3fc", "#0ea5e9"); // Đồ uống
    }

    // Quán ăn / nhà hàng
    if (
      loaiHinh.includes("quán ăn") ||
      loaiHinh.includes("quan an") ||
      loaiHinh.includes("nhà hàng") ||
      loaiHinh.includes("nha hang")
    ) {
      return createPinIcon("🍜", "#fed7aa", "#f97316"); // Đồ ăn
    }

    // fallback ăn uống chung (Tất cả)
    return createPinIcon("🍽️", "#bbf7d0", "#22c55e");
  }

  /* ==========================
     MUA SẮM (loai_hinh)
  ========================== */
  if (layerKey === "muasam") {
    if (
      loaiHinh.includes("chợ truyền thống") ||
      loaiHinh.includes("cho truyen thong")
    ) {
      return createPinIcon("🧺", "#fed7aa", "#f97316"); // chợ
    }

    if (loaiHinh.includes("siêu thị") || loaiHinh.includes("sieu thi")) {
      return createPinIcon("🛒", "#bbf7d0", "#22c55e"); // siêu thị
    }

    if (
      loaiHinh.includes("trung tâm thương mại") ||
      loaiHinh.includes("trung tam thuong mai") ||
      loaiHinh.includes("tttm")
    ) {
      return createPinIcon("🏬", "#c4b5fd", "#6366f1"); // TTTM
    }

    // fallback mua sắm chung (Tất cả)
    return createPinIcon("🛍️", "#7dd3fc", "#0ea5e9");
  }

  /* ==========================
     LƯU TRÚ (hang_sao)
     → dùng icon khách sạn 🏨, mỗi hạng sao màu pin khác nhau
  ========================== */
  if (layerKey === "luutru") {
    if (hangSao.startsWith("1"))
      return createPinIcon("🏨", "#e5e7eb", "#9ca3af"); // xám nhạt
    if (hangSao.startsWith("2"))
      return createPinIcon("🏨", "#bbf7d0", "#22c55e"); // xanh lá nhạt
    if (hangSao.startsWith("3"))
      return createPinIcon("🏨", "#86efac", "#16a34a"); // xanh lá đậm
    if (hangSao.startsWith("4"))
      return createPinIcon("🏨", "#bfdbfe", "#2563eb"); // xanh dương
    if (hangSao.startsWith("5"))
      return createPinIcon("🏨", "#facc15", "#eab308"); // vàng nổi bật

    // fallback lưu trú (Tất cả)
    return createPinIcon("🏨", "#d1d5db", "#4b5563");
  }

  /* ==========================
     DỊCH VỤ CHUNG (loai_dv)
  ========================== */
  if (layerKey === "dichvu") {
    // Y tế – bệnh viện
    if (
      loaiDv.includes("y tế") ||
      loaiDv.includes("y te") ||
      loaiDv.includes("bệnh viện") ||
      loaiDv.includes("benh vien") ||
      loaiDv.includes("phòng khám") ||
      loaiDv.includes("phong kham")
    ) {
      return createPinIcon("🏥", "#fecaca", "#ef4444");
    }

    // Hỗ trợ – Ngân hàng / ATM
    if (
      loaiDv.includes("ngân hàng") ||
      loaiDv.includes("ngan hang") ||
      loaiDv.includes("atm") ||
      loaiDv.includes("hỗ trợ") ||
      loaiDv.includes("ho tro")
    ) {
      return createPinIcon("🏦", "#7dd3fc", "#0ea5e9");
    }

    // Trạm xăng
    if (
      loaiDv.includes("trạm xăng") ||
      loaiDv.includes("tram xang") ||
      loaiDv.includes("cửa hàng xăng dầu") ||
      loaiDv.includes("cua hang xang dau")
    ) {
      return createPinIcon("⛽", "#fed7aa", "#f97316");
    }

    // Vận chuyển – Bến xe / xe buýt
    if (
      loaiDv.includes("vận chuyển") ||
      loaiDv.includes("van chuyen") ||
      loaiDv.includes("bến xe") ||
      loaiDv.includes("ben xe") ||
      loaiDv.includes("xe buýt") ||
      loaiDv.includes("xe buyt")
    ) {
      return createPinIcon("🚍", "#bbf7d0", "#22c55e");
    }

    // fallback dịch vụ chung (Tất cả)
    return createPinIcon("ℹ️", "#bfdbfe", "#3b82f6");
  }

  return null;
}

/**
 * Nếu muốn tự động chọn emoji theo thuộc tính nói chung (ít dùng),
 * vẫn giữ lại để có thể tận dụng sau.
 */
export function getEmojiForFeature(feature) {
  const loai =
    (
      feature?.properties?.loai_hinh ||
      feature?.properties?.loai_dv ||
      feature?.properties?.hang_sao ||
      feature?.properties?.ten ||
      ""
    )
      .toString()
      .toLowerCase();

  if (loai.includes("ăn") || loai.includes("ẩm thực") || loai.includes("food"))
    return "🍽️";
  if (loai.includes("mua sắm") || loai.includes("shop")) return "🛍️";
  if (
    loai.includes("lưu trú") ||
    loai.includes("khách sạn") ||
    loai.includes("hotel")
  )
    return "🏨";
  if (loai.includes("dịch vụ")) return "ℹ️";
  return "📍";
}

/* ====== ICON CỐ ĐỊNH CHO TỪNG LỚP – FALLBACK ====== */

// Điểm du lịch: di tích, tham quan, văn hoá
export const iconDuLich = createPinIcon("🏛️", "#bfdbfe", "#2563eb");

// Ăn uống: quán ăn, quán nước, café...
export const iconAnUong = createPinIcon("🍽️", "#bbf7d0", "#22c55e");

// Mua sắm: cửa hàng, chợ, TTTM...
export const iconMuaSam = createPinIcon("🛍️", "#7dd3fc", "#0ea5e9");

// Lưu trú: khách sạn, resort, homestay...
export const iconLuuTru = createPinIcon("🏨", "#d1d5db", "#4b5563");

// Dịch vụ chung: thông tin, hỗ trợ, dịch vụ khác
export const iconDichVu = createPinIcon("ℹ️", "#bfdbfe", "#3b82f6");
