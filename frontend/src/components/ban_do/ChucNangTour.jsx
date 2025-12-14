// src/components/ban_do/ChucNangTour.jsx
import React, { useState, useMemo, useEffect } from "react";
import { LANGUAGE_TEXT } from "../../constants/text_ban_do";
import { TOURS } from "../../constants/tours";
// Nếu bạn tạo file CSS riêng cho panel tour thì mở comment dòng dưới
// import "./ChucNangTour.css";

// Các lựa chọn lọc theo thời gian
const DURATION_FILTERS = [
  { key: "all", label: "Tất cả thời gian" },
  { key: "1N", label: "1 ngày" },
  { key: "2N1D", label: "2 ngày 1 đêm" },
  { key: "3N2D", label: "3 ngày 2 đêm" },
];

// Các lựa chọn lọc theo loại hình
const CATEGORY_FILTERS = [
  { key: "all", label: "Tất cả loại hình" },
  { key: "tam_linh", label: "Tâm linh" },
  { key: "sinh_thai", label: "Sinh thái – rừng núi" },
  { key: "bien_dao", label: "Biển đảo – nghỉ dưỡng" },
  { key: "van_hoa", label: "Văn hóa – lịch sử" },
  { key: "lang_nghe", label: "Làng nghề – cộng đồng" },
];

/* ====== DROPDOWN SẮP XẾP ====== */
const SORT_OPTIONS = [
  { key: "default", label: "Mặc định" },
  { key: "favorites", label: "Ưu tiên tour yêu thích" },
  { key: "many_stops", label: "Nhiều điểm dừng → ít" },
  { key: "short_distance", label: "Quãng đường ngắn → dài (ước tính)" },
];

/* ====== HÀM SUY LUẬN LOẠI THỜI GIAN (1N / 2N1D / 3N2D) ====== */
function detectDurationType(tour) {
  const raw = (tour.duration || "").toString().toLowerCase();

  // Ưu tiên 3N2Đ
  if (
    raw.includes("3n2đ") ||
    raw.includes("3n2d") ||
    raw.includes("3 ngày 2 đêm") ||
    raw.includes("3 ngày, 2 đêm")
  ) {
    return "3N2D";
  }

  // 2N1Đ
  if (
    raw.includes("2n1đ") ||
    raw.includes("2n1d") ||
    raw.includes("2 ngày 1 đêm") ||
    raw.includes("2 ngày, 1 đêm")
  ) {
    return "2N1D";
  }

  // Chuỗi kiểu "2 ngày", "2 ngày 2 đêm" (vẫn cho vào 2N1D)
  if (raw.includes("2 ngày")) {
    return "2N1D";
  }

  // Chuỗi kiểu "1–2 ngày", "1-2 ngày" → cho tạm về nhóm 1N
  if (raw.includes("1–2 ngày") || raw.includes("1-2 ngày")) {
    return "1N";
  }

  // 1 ngày
  if (raw.includes("1 ngày")) {
    return "1N";
  }

  // Nếu không nhận diện được thì cho về all
  return "all";
}

/* ====== HÀM SUY LUẬN LOẠI HÌNH TỪ THEME ====== */
function detectCategory(tour) {
  // Nếu constants/tours.js đã có sẵn category thì ưu tiên dùng
  if (tour.category) return tour.category;

  const theme = (tour.theme || "").toString().toLowerCase();

  if (theme.includes("tâm linh")) {
    return "tam_linh";
  }

  if (
    theme.includes("sinh thái") ||
    theme.includes("tự nhiên") ||
    theme.includes("rừng") ||
    theme.includes("núi") ||
    theme.includes("bảy núi")
  ) {
    return "sinh_thai";
  }

  if (
    theme.includes("biển") ||
    theme.includes("đảo") ||
    theme.includes("nghỉ dưỡng") ||
    theme.includes("resort")
  ) {
    return "bien_dao";
  }

  if (
    theme.includes("văn hóa") ||
    theme.includes("văn hoá") ||
    theme.includes("lịch sử") ||
    theme.includes("di sản") ||
    theme.includes("bảo tàng")
  ) {
    return "van_hoa";
  }

  if (
    theme.includes("làng nghề") ||
    theme.includes("cộng đồng") ||
    theme.includes("homestay")
  ) {
    return "lang_nghe";
  }

  // Mặc định
  return "khac";
}

/* ====== LẤY DANH SÁCH KHU VỰC XUẤT PHÁT TỪ TOURS ====== */
function buildStartCityFilters() {
  const cities = new Set();
  TOURS.forEach((tour) => {
    if (tour.startCity) {
      cities.add(tour.startCity);
    }
  });

  const items = Array.from(cities)
    .sort()
    .map((c) => ({
      key: c,
      label: `Từ ${c}`,
    }));

  return [{ key: "all", label: "Tất cả khu vực xuất phát" }, ...items];
}

const START_CITY_FILTERS = buildStartCityFilters();

export default function ChucNangTour({ lang = "vi", onSelectTour }) {
  const t = LANGUAGE_TEXT[lang];

  // state lọc
  const [durationFilter, setDurationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startCityFilter, setStartCityFilter] = useState("all");

  // sắp xếp
  const [sortMode, setSortMode] = useState("default");

  // tour yêu thích (lưu localStorage)
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = window.localStorage.getItem("favoriteTours");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "favoriteTours",
          JSON.stringify(favoriteIds)
        );
      }
    } catch {
      // ignore
    }
  }, [favoriteIds]);

  const toggleFavorite = (tourId) => {
    setFavoriteIds((prev) =>
      prev.includes(tourId)
        ? prev.filter((id) => id !== tourId)
        : [...prev, tourId]
    );
  };

  // trạng thái chia sẻ
  const [shareMessage, setShareMessage] = useState("");

  // danh sách tour sau khi áp dụng bộ lọc
  const filteredTours = useMemo(() => {
    return TOURS.filter((tour) => {
      // Tự suy luận nếu không khai báo trong constants/tours.js
      const tourDuration = tour.durationType || detectDurationType(tour);
      const tourCategory = tour.category || detectCategory(tour);
      const tourStartCity = tour.startCity || "Khác";

      const matchDuration =
        durationFilter === "all" || tourDuration === durationFilter;
      const matchCategory =
        categoryFilter === "all" || tourCategory === categoryFilter;
      const matchCity =
        startCityFilter === "all" || tourStartCity === startCityFilter;

      return matchDuration && matchCategory && matchCity;
    });
  }, [durationFilter, categoryFilter, startCityFilter]);

  // áp dụng sắp xếp (dropdown)
  const sortedTours = useMemo(() => {
    const items = [...filteredTours];

    if (sortMode === "many_stops") {
      items.sort((a, b) => (b.stops?.length || 0) - (a.stops?.length || 0));
    } else if (sortMode === "short_distance") {
      const getDist = (t) =>
        t.quickStats?.distanceKm ||
        t.quickStats?.distance ||
        (t.stops?.length || 0) * 3;
      items.sort((a, b) => getDist(a) - getDist(b));
    } else if (sortMode === "favorites") {
      items.sort((a, b) => {
        const aFav = favoriteIds.includes(a.id);
        const bFav = favoriteIds.includes(b.id);
        if (aFav === bFav) return 0;
        return aFav ? -1 : 1; // tour yêu thích lên trước
      });
    }
    // default: giữ nguyên thứ tự khai báo trong TOURS
    return items;
  }, [filteredTours, sortMode, favoriteIds]);

  /* ====== HÀM CHIA SẺ TOUR ====== */
  const handleShareTour = (tour) => {
    const name = tour.name;
    const duration = tour.duration;
    const theme = tour.theme;
    const stops = (tour.stops || []).join(" → ");

    // Lấy URL hiện tại (không hash)
    let baseUrl = "";
    if (typeof window !== "undefined") {
      baseUrl =
        window.location.origin +
        window.location.pathname +
        (window.location.search || "");
    }

    const text = `Gợi ý tour: ${name} (${duration})\nChủ đề: ${theme}\nCác điểm chính: ${stops}\nXem chi tiết trên WebGIS: ${baseUrl}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setShareMessage("Đã sao chép nội dung tour vào clipboard.");
      } else {
        setShareMessage(text);
      }
    } catch (err) {
      console.warn("Không thể sao chép clipboard:", err);
      setShareMessage(text);
    }
  };

  return (
    <div className="panel panel-tour">
      <h3 className="tour-title-main">{t.tourPanelTitle}</h3>

      <p className="tour-subtitle">
        Gợi ý các hành trình du lịch tiêu biểu. Lọc theo thời gian, loại hình,
        khu vực xuất phát, ưu tiên tour yêu thích và xem chi tiết trên bản đồ.
      </p>

      {/* Thanh lọc */}
      <div className="tour-filter-wrap">
        {/* Thời gian */}
        <div className="tour-filter-section">
          <div className="tour-filter-title">Thời gian:</div>
          <div className="tour-filter-group">
            {DURATION_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={
                  "tour-filter-btn" +
                  (durationFilter === item.key ? " active" : "")
                }
                onClick={() => setDurationFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loại hình */}
        <div className="tour-filter-section">
          <div className="tour-filter-title">Loại hình:</div>
          <div className="tour-filter-group">
            {CATEGORY_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={
                  "tour-filter-btn" +
                  (categoryFilter === item.key ? " active" : "")
                }
                onClick={() => setCategoryFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Khu vực xuất phát */}
        <div className="tour-filter-section">
          <div className="tour-filter-title">Khu vực xuất phát:</div>
          <div className="tour-filter-group">
            {START_CITY_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={
                  "tour-filter-btn" +
                  (startCityFilter === item.key ? " active" : "")
                }
                onClick={() => setStartCityFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown sắp xếp */}
        <div className="tour-filter-section">
          <div className="tour-filter-title">Ưu tiên hiển thị:</div>
          <div className="tour-sort-wrap">
            <select
              className="tour-sort-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách tour */}
      <div className="tour-list">
        {sortedTours.map((tour) => {
          const stopsCount = tour.stops ? tour.stops.length : 0;
          const stats = tour.quickStats || {};

          const distanceText =
            stats.distanceText ||
            stats.distance ||
            "~ " + stopsCount * 3 + " km";
          const moveTimeText =
            stats.moveTimeText ||
            stats.travelTime ||
            "Ước tính " + stopsCount * 15 + " phút";

          const isFav = favoriteIds.includes(tour.id);

          return (
            <div key={tour.id} className="tour-card">
              <div className="tour-card-header">
                <div className="tour-card-header-left">
                  <div className="tour-card-name">{tour.name}</div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(tour.id)}
                    title={
                      isFav
                        ? "Bỏ khỏi tour yêu thích"
                        : "Thêm vào tour yêu thích"
                    }
                    className="tour-favorite-btn"
                  >
                    {isFav ? "★" : "☆"}
                  </button>
                </div>
                <div className="tour-card-duration">⏱ {tour.duration}</div>
              </div>

              {/* Chủ đề + xuất phát + thống kê nhanh */}
              <div className="tour-card-theme">
                🎯 {tour.theme}
                {tour.startCity && (
                  <span className="tour-card-startcity">
                    • Xuất phát: {tour.startCity}
                  </span>
                )}
              </div>

              <div className="tour-card-quickstats">
                <span>📌 {stopsCount} điểm dừng</span>
                <span>• 📏 {distanceText}</span>
                <span>• 🚐 {moveTimeText}</span>
              </div>

              {/* Danh sách điểm dừng */}
              <ul className="tour-stops">
                {tour.stops.map((stop, idx) => (
                  <li key={idx}>
                    <span className="tour-stop-icon">📍</span>
                    <span>{stop}</span>
                  </li>
                ))}
              </ul>

              {/* Lịch trình theo giờ nếu có */}
              {tour.timeline && tour.timeline.length > 0 && (
                <div className="tour-timeline-wrap">
                  <div className="tour-timeline-title">Lịch trình gợi ý:</div>
                  <ul className="tour-timeline">
                    {tour.timeline.map((item, idx) => (
                      <li key={idx}>
                        <span className="tour-timeline-time">
                          {item.time || ""}
                        </span>
                        <span className="tour-timeline-text">
                          {item.label ||
                            item.title ||
                            item.stop ||
                            item.text ||
                            ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nhóm nút hành động */}
              <div className="tour-card-actions">
                <button
                  className="tour-btn"
                  onClick={() =>
                    onSelectTour && onSelectTour(tour, { autoPlay: false })
                  }
                >
                  Xem tour trên bản đồ
                </button>

                <button
                  className="tour-btn tour-btn-secondary"
                  onClick={() =>
                    onSelectTour && onSelectTour(tour, { autoPlay: true })
                  }
                >
                  🚐 Xem tour tự động
                </button>

                <button
                  className="tour-btn tour-btn-ghost"
                  onClick={() => handleShareTour(tour)}
                >
                  Chia sẻ tour
                </button>
              </div>
            </div>
          );
        })}

        {sortedTours.length === 0 && (
          <div className="tour-empty">
            Chưa có tour phù hợp với bộ lọc hiện tại.
          </div>
        )}

        {shareMessage && (
          <div className="tour-share-message">{shareMessage}</div>
        )}
      </div>
    </div>
  );
}
