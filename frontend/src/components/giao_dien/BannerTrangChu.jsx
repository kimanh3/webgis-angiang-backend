// src/components/giao_dien/BannerTrangChu.jsx
import React from "react";

export default function BannerTrangChu({ lang = "vi" }) {
  const TEXT = {
    vi: {
      title: "Khám phá vẻ đẹp An Giang",
      subtitle:
        "Khám phá các điểm tham quan, ẩm thực, mua sắm và lưu trú trên nền WebGIS du lịch An Giang.",
    },
    en: {
      title: "Explore the Beauty of An Giang",
      subtitle:
        "Discover attractions, food, shopping and accommodation on An Giang tourism WebGIS.",
    },
  };

  const t = TEXT[lang] || TEXT.vi;

  const REMOTE_IMAGE =
    "https://static.vinwonders.com/production/2025/10/nui-cam-an-giang.jpg";

  return (
    <section
      style={{
        position: "relative",
        zIndex: 1,
        width: "100%",

        // giữ chiều cao đẹp, không chiếm toàn màn hình
        height: "46vh",
        minHeight: 260,
        maxHeight: 420,

        margin: "0 auto",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "0 24px",
        color: "#ffffff",

        // ❌ KHÔNG BO TRÒN
        borderRadius: 0,

        overflow: "hidden",
        background: `
          linear-gradient(
            115deg,
            rgba(0, 143, 213, 0.35) 0%,
            rgba(0, 143, 213, 0.22) 30%,
            rgba(0, 0, 0, 0.18) 100%
          ),
          url(${REMOTE_IMAGE}) center/cover no-repeat
        `,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
      }}
    >
      {/* Container bề rộng khớp layout TrangChu */}
      <div
        style={{
          width: "100%",
          maxWidth: 1280,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Panel glass dark bên trái */}
        <div
          style={{
            maxWidth: 480,
            padding: "16px 22px 20px",
            borderRadius: 18,
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(15,23,42,0.68))",
            boxShadow: "0 18px 40px rgba(15,23,42,0.6)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              marginBottom: 10,
              color: "#EAF7FF",
              fontWeight: 600,
              opacity: 0.96,
            }}
          >
            WebGIS du lịch An Giang
          </div>

          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: 10,
              textShadow: "0 4px 18px rgba(0,0,0,0.75)",
            }}
          >
            {t.title}
          </h1>

          <p
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              maxWidth: 420,
              color: "#F8FAFC",
              opacity: 0.95,
              textShadow: "0 3px 12px rgba(0,0,0,0.55)",
              marginBottom: 10,
            }}
          >
            {t.subtitle}
          </p>

          {/* Icon vị trí nhỏ */}
          <div
            style={{
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "#E5F5FF",
              opacity: 0.9,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                border: "1px solid rgba(148,197,253,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              📍
            </span>
            <span>
              {lang === "vi" ? "An Giang, Việt Nam" : "An Giang, Viet Nam"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
