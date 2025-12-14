// src/constants/text_ban_do.js
export const LANGUAGE_TEXT = {
  vi: {
    layersPanelTitle: "Lớp bản đồ & lọc dữ liệu",
    layersPanelSubtitle:
      "Bật / tắt các lớp dữ liệu du lịch, ẩm thực, mua sắm, lưu trú, dịch vụ.",
    routePanelTitle: "Tìm đường di chuyển",
    nearPanelTitle: "Tìm quanh đây",
    tourPanelTitle: "Tour gợi ý",
  },
  en: {
    layersPanelTitle: "Map layers & filters",
    layersPanelSubtitle:
      "Toggle layers for tourism, food, shopping, accommodation and services.",
    routePanelTitle: "Routing",
    nearPanelTitle: "Nearby search",
    tourPanelTitle: "Suggested tours",
  },
};

export const POPUP_TEXT = {
  vi: {
    viewDetail: "Xem chi tiết",
  },
  en: {
    viewDetail: "View detail",
  },
};

// alias cho code cũ đang import PANEL_TEXT
export const PANEL_TEXT = LANGUAGE_TEXT;
