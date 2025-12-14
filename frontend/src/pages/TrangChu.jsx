// src/pages/TrangChu.jsx
import React, { useState } from "react";
import BannerTrangChu from "../components/giao_dien/BannerTrangChu";

export default function TrangChu({ lang = "vi" }) {
  const isVi = lang === "vi";
  const [activeTab, setActiveTab] = useState("dulich");

  const FEATURE_BUTTONS = [
    {
      id: "lopdulieu",
      icon: "🗂️",
      labelVi: "Quản lý lớp dữ liệu",
      labelEn: "Layer management",
      descVi: "Bật / tắt, lọc lớp dữ liệu du lịch, ăn uống, lưu trú, mua sắm…",
      descEn: "Toggle & filter layers of attractions, food, stay, shopping…",
    },
    {
      id: "timduonga",
      icon: "🚗",
      labelVi: "Tìm đường đi",
      labelEn: "Route ",
      descVi: "Tính toán quãng đường, thời gian di chuyển giữa hai điểm.",
      descEn: "Compute distance & travel time between two locations.",
    },
    {
      id: "timquanhday",
      icon: "📍",
      labelVi: "Tìm điểm quanh vị trí",
      labelEn: "Nearby search",
      descVi: "Tìm các điểm du lịch, ăn uống… trong bán kính bạn chọn.",
      descEn: "Search nearby places within your chosen radius.",
    },
    {
      id: "tourgoiy",
      icon: "🚌",
      labelVi: "Tour gợi ý & chạy tự động",
      labelEn: "Suggested tours & auto play",
      descVi: "Xem tour mẫu, xe di chuyển tự động trên bản đồ.",
      descEn: "View sample tours with animated routes on the map.",
    },
  ];

  const DESTINATIONS = [
    {
      id: 1,
      name: "Miếu Bà Chúa Xứ",
      tag: "Tâm linh",
      rating: 4.9,
      reviews: 320,
      image:
        "https://mia.vn/media/uploads/blog-du-lich/mieu-ba-chua-xu-nui-sam-chau-doc-diem-den-tam-linh-tru-danh-nam-bo-5-1659707554.jpg",
    },
    {
      id: 2,
      name: "Núi Sam",
      tag: "Cảnh quan",
      rating: 4.8,
      reviews: 210,
      image:
        "https://vcdn1-dulich.vnecdn.net/2024/05/23/bnsaoca3-1716472663-1716472673-2179-1716472887.png?w=500&h=300&q=100&dpr=1&fit=crop&s=JQ2ab_MV7t2SmVXdbBnSrg",
    },
    {
      id: 3,
      name: "Rừng tràm Trà Sư",
      tag: "Sinh thái",
      rating: 4.9,
      reviews: 420,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRtLht4urbie0m9PVeNzzXa3KW6WkBAWuCrw&s",
    },
    {
      id: 4,
      name: "Chợ nổi Long Xuyên",
      tag: "Trải nghiệm",
      rating: 4.7,
      reviews: 180,
      image:
        "https://danviet.ex-cdn.com/files/f1/2018/12/images/59b6023a-cho-noi-long-xuyen-2.jpg",
    },
  ];

  const STAT_TITLES = {
    dulich: isVi ? "Điểm du lịch" : "Attractions",
    amthuc: isVi ? "Ẩm thực" : "Food",
    muasam: isVi ? "Mua sắm" : "Shopping",
    luutru: isVi ? "Lưu trú" : "Accommodation",
    tonghop: isVi ? "Tổng hợp" : "Overview",
  };

  return (
    <main
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background:
          "linear-gradient(180deg, #C5ECFF 0%, #FFFFFF 40%, #E7F3FF 75%, #FFFFFF 100%)",
        minHeight: "100vh",
        paddingBottom: 16,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* BANNER */}
      <BannerTrangChu lang={lang} />

      {/* CARD TRANG CHỦ – GIÃN HẾT PHẦN CÒN LẠI MÀN HÌNH */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          width: "calc(100% - 40px)", // ⭐ chỉ chừa 20px mỗi bên
          maxWidth: 1600,
          margin: "24px auto 0",
          borderRadius: 26,
          overflow: "hidden",
          background: "#FFFFFF",
          boxShadow:
            "0 20px 40px rgba(135,206,235,0.24), 0 8px 20px rgba(15,23,42,0.08)",
          border: "1px solid #D3E3FC",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* KHU 2 CỘT */}
        <div
          style={{
            padding: "28px 32px 32px",
            background:
              "linear-gradient(180deg, #FFFFFF 0%, #E3F1FF 40%, #FFFFFF 100%)",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.25fr",
              gap: 28,
              alignItems: "stretch",
            }}
          >
            {/* CỘT TRÁI – HERO + NÚT */}
            <section
              style={{
                borderRadius: 26,
                padding: 28,
                minHeight: 260,
                background:
                  "linear-gradient(135deg, #2EC8FF, #7FD7FF, #BEEBFF)",
                color: "#0f172a",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.28,
                  backgroundImage:
                    "radial-gradient(circle at 0% 0%, #FFFFFF 0%, transparent 60%), radial-gradient(circle at 100% 100%, #FFFFFF 0%, transparent 60%)",
                }}
              />

              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 1.6,
                    color: "#EFFFFF",
                    marginBottom: 6,
                    textShadow: "0 1px 3px rgba(0,0,0,0.25)",
                  }}
                >
                  {isVi
                    ? "WebGIS Du lịch An Giang"
                    : "An Giang Tourism WebGIS"}
                </div>

                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 750,
                    color: "#FFFFFF",
                    textShadow: "0 2px 6px rgba(0,0,0,0.35)",
                    marginBottom: 10,
                  }}
                >
                  {isVi
                    ? "Khám phá vẻ đẹp An Giang"
                    : "Explore the beauty of An Giang"}
                </h1>

                <p
                  style={{
                    fontSize: 13,
                    maxWidth: 520,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.95)",
                    marginBottom: 18,
                  }}
                >
                  {isVi
                    ? "Bản đồ du lịch văn hóa – ẩm thực giúp tra cứu thông tin và lập kế hoạch hành trình."
                    : "A cultural–culinary tourism map for searching information and planning trips."}
                </p>

                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <a
                    href="/map"
                    style={{
                      padding: "10px 20px",
                      borderRadius: 999,
                      background: "linear-gradient(135deg, #00BFFF, #0090D9)",
                      color: "#FFFFFF",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      boxShadow: "0 10px 20px rgba(0,191,255,0.45)",
                    }}
                  >
                    {isVi ? "Mở bản đồ ngay" : "Open map now"} ⤴
                  </a>

                  <a
                    href="/data"
                    style={{
                      padding: "10px 16px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(176,196,222,0.9)",
                      color: "#0f172a",
                      textDecoration: "none",
                      fontSize: 12,
                    }}
                  >
                    {isVi ? "Xem dữ liệu du lịch" : "Browse tourism data"}
                  </a>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 12,
                  }}
                >
                  {FEATURE_BUTTONS.map((btn) => (
                    <div
                      key={btn.id}
                      style={{
                        background:
                          "linear-gradient(135deg, #FFFFFF, #E5F1FF)",
                        border: "1px solid #B8D3F5",
                        borderRadius: 18,
                        padding: 14,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        minHeight: 92,
                        boxShadow: "0 10px 18px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle at 30% 10%, #87CEFA, #2EC8FF)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          color: "#FFFFFF",
                        }}
                      >
                        {btn.icon}
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "#0f172a",
                            marginBottom: 2,
                          }}
                        >
                          {isVi ? btn.labelVi : btn.labelEn}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#4b5563",
                            lineHeight: 1.5,
                          }}
                        >
                          {isVi ? btn.descVi : btn.descEn}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CỘT PHẢI – DASHBOARD */}
            <section
              style={{
                borderRadius: 26,
                background: "#FFFFFF",
                border: "1px solid #D3E3FC",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minHeight: 260,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1.2,
                      color: "#00A2E8",
                      marginBottom: 4,
                    }}
                  >
                    {isVi ? "Bảng điều khiển" : "Dashboard"}
                  </div>

                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {isVi
                      ? "Bản đồ du lịch văn hóa ẩm thực An Giang"
                      : "Cultural & culinary tourism map of An Giang"}
                  </h2>
                </div>

                <a
                  href="/map"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #00BFFF, #0090D9)",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {isVi ? "Đi tới bản đồ" : "Go to map"}
                </a>
              </div>

              <div
                style={{
                  background: "#D3E3FC",
                  padding: 4,
                  borderRadius: 999,
                  display: "inline-flex",
                }}
              >
                {["dulich", "amthuc", "muasam", "luutru", "tonghop"].map(
                  (key) => {
                    const active = activeTab === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        style={{
                          border: "none",
                          background: active
                            ? "linear-gradient(135deg, #00BFFF, #0090D9)"
                            : "transparent",
                          color: active ? "#FFFFFF" : "#1f2937",
                          padding: "6px 14px",
                          borderRadius: 999,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: active ? 600 : 500,
                          marginRight: 4,
                        }}
                      >
                        {STAT_TITLES[key]}
                      </button>
                    );
                  }
                )}
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "#111827",
                  }}
                >
                  {isVi ? "Tra cứu dữ liệu" : "Data overview"}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #00BFFF, #0090D9)",
                      padding: 16,
                      borderRadius: 18,
                      color: "#FFFFFF",
                    }}
                  >
                    <div style={{ fontSize: 11, opacity: 0.9 }}>
                      {isVi ? "Tổng số bản ghi" : "Total records"}
                    </div>
                    <div
                      style={{ fontSize: 26, fontWeight: 700, margin: "6px 0" }}
                    >
                      1400
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.9 }}>
                      {isVi
                        ? "Bao gồm tất cả loại hình du lịch."
                        : "Including all categories."}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#FFFFFF",
                      padding: 16,
                      borderRadius: 18,
                      border: "1px solid #D3E3FC",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#4b5563",
                        marginBottom: 6,
                      }}
                    >
                      {isVi ? "Số đơn vị hành chính" : "Admin units"}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>11</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      {isVi
                        ? "Toàn bộ huyện và thành phố."
                        : "All districts & city."}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#B0E0E6",
                      padding: 16,
                      borderRadius: 18,
                      border: "1px solid #ADD8E6",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#003A57" }}>
                      {isVi ? "Cập nhật gần nhất" : "Last update"}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#003A57",
                        marginTop: 6,
                      }}
                    >
                      12/2025
                    </div>
                    <div style={{ fontSize: 11, color: "#003A57" }}>
                      {isVi
                        ? "Dữ liệu được rà soát định kỳ."
                        : "Reviewed regularly."}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {isVi
                    ? "Thông tin nhanh theo loại hình"
                    : "Quick info by category"}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 10,
                  }}
                >
                  {[480, 320, 210, 160].map((value, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#FFFFFF",
                        borderRadius: 14,
                        border: "1px solid #D3E3FC",
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          marginBottom: 3,
                        }}
                      >
                        {Object.values(STAT_TITLES)[idx]}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* PHẦN DƯỚI – ĐIỂM ĐẾN NỔI BẬT */}
          <section
            style={{
              marginTop: 32,
              padding: 20,
              borderRadius: 22,
              border: "1px solid #D3E3FC",
              background: "#FFFFFF",
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "#00A2E8",
                textTransform: "uppercase",
                marginBottom: 4,
                letterSpacing: 1.4,
              }}
            >
              {isVi ? "Gợi ý khám phá" : "Explore Suggestions"}
            </div>

            <h2
              style={{
                textAlign: "center",
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {isVi ? "Điểm đến nổi bật" : "Featured Destinations"}
            </h2>

            <p
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "#6b7280",
                maxWidth: 600,
                margin: "0 auto 20px",
              }}
            >
              {isVi
                ? "Một số điểm tham quan được nhiều du khách yêu thích."
                : "Popular attractions in An Giang."}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 18,
              }}
            >
              {DESTINATIONS.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #D3E3FC",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ height: 150, position: "relative" }}>
                    <img
                      src={d.image}
                      alt={d.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    <span
                      style={{
                        position: "absolute",
                        bottom: 10,
                        left: 12,
                        padding: "4px 10px",
                        fontSize: 11,
                        background:
                          "linear-gradient(135deg, #00BFFF, #0090D9)",
                        color: "#FFFFFF",
                        borderRadius: 999,
                      }}
                    >
                      {d.tag}
                    </span>
                  </div>

                  <div style={{ padding: 12, textAlign: "center" }}>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {d.name}
                    </h3>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#00A2E8",
                        display: "flex",
                        gap: 6,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      ⭐ {d.rating}
                      <span style={{ color: "#6b7280" }}>
                        ({d.reviews}+ {isVi ? "đánh giá" : "reviews"})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer
        style={{
          marginTop: 8,
          textAlign: "center",
          fontSize: 12,
          color: "#0090D9",
        }}
      >
        © {new Date().getFullYear()} An Giang Explorer WebGIS —{" "}
        {isVi ? "Đồ án GIS & WebGIS" : "GIS & WebGIS Project"}
      </footer>
    </main>
  );
}
