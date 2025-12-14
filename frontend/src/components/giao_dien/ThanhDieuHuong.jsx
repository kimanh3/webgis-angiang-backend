// src/components/giao_dien/ThanhDieuHuong.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import NutChonNgonNgu from "./NutChonNgonNgu";
import { UI_TEXT } from "../../constants/ngon_ngu";
import { adminAuth } from "../../api/adminApi";

export default function ThanhDieuHuong({ lang, setLang }) {
  const t = UI_TEXT[lang || "vi"];
  const location = useLocation();

  // trạng thái đã đăng nhập admin hay chưa
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const syncLoginState = () => {
      setIsAdminLoggedIn(adminAuth.isLoggedIn());
    };

    // lần đầu vào trang
    syncLoginState();

    // thay đổi từ tab khác hoặc code tự dispatch
    window.addEventListener("storage", syncLoginState);
    window.addEventListener("admin-login-change", syncLoginState);

    return () => {
      window.removeEventListener("storage", syncLoginState);
      window.removeEventListener("admin-login-change", syncLoginState);
    };
  }, []);

  // 👉 Nút duy nhất: nếu chưa login → Đăng nhập, đã login → Quản trị
  const adminButtonPath = isAdminLoggedIn ? "/admin" : "/login";
  const adminButtonLabel = isAdminLoggedIn ? t.admin : t.login;

  // style cho item menu
  const navItemStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      padding: "6px 16px",
      borderRadius: 999,
      textDecoration: "none",
      fontSize: 13,
      fontWeight: isActive ? 600 : 500,
      color: isActive ? "#FFFFFF" : "#475569",
      background: isActive
        ? "linear-gradient(135deg, #00BFFF, #0090D9)"
        : "transparent",
      boxShadow: isActive
        ? "0 6px 16px rgba(0,191,255,0.35)"
        : "none",
      transition: "background 0.15s ease, color 0.15s ease",
      whiteSpace: "nowrap",
    };
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #E5F2FF 60%, #FFFFFF 100%)",
        boxShadow: "0 1px 0 rgba(148,163,184,0.35)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          maxWidth: 1480, // khớp với TrangChu.jsx
          margin: "0 auto",
          padding: "8px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* LOGO + TÊN HỆ THỐNG */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Logo màu xanh biển pastel */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background:
                "linear-gradient(145deg, #00BFFF 0%, #38bdf8 45%, #0ea5e9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 14px rgba(56,189,248,0.55)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 20, color: "#ecfeff" }}>🧭</span>
          </div>

          <div style={{ lineHeight: 1.25 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#0f172a",
              }}
            >
              {t.appTitle || "An Giang Explorer"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
              }}
            >
              WebGIS Du lịch An Giang
            </div>
          </div>
        </div>

        {/* MENU BÊN PHẢI */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Nhóm menu bo tròn, nền xanh nhạt giống thẻ trong TrangChu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px",
              borderRadius: 999,
              backgroundColor: "#E5F3FF", // pastel skyblue
              border: "1px solid #D3E3FC",
            }}
          >
            <Link to="/" style={navItemStyle("/")}>
              {t.home}
            </Link>

            <Link to="/map" style={navItemStyle("/map")}>
              {t.map}
            </Link>

            <Link to="/data" style={navItemStyle("/data")}>
              {t.data}
            </Link>

            <Link to={adminButtonPath} style={navItemStyle(adminButtonPath)}>
              {adminButtonLabel}
            </Link>
          </div>

          {/* NÚT CHỌN NGÔN NGỮ */}
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #D3E3FC",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 2px 6px rgba(148,163,184,0.25)",
            }}
          >
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              {lang === "vi" ? "VI" : "EN"}
            </span>
            <NutChonNgonNgu lang={lang} onChange={setLang} />
          </div>
        </nav>
      </div>
    </header>
  );
}
