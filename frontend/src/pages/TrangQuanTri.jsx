// src/pages/TrangQuanTri.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuth } from "../api/adminApi";

// Import các form CRUD
import FormDuLich from "../components/quan_tri/FormDuLich";
import FormAnUong from "../components/quan_tri/FormAnUong";
import FormMuaSam from "../components/quan_tri/FormMuaSam";
import FormLuuTru from "../components/quan_tri/FormLuuTru";
import FormDichVu from "../components/quan_tri/FormDichVu";

const TABS = [
  { id: "dulich", label: "Du lịch" },
  { id: "anuong", label: "Ăn uống" },
  { id: "muasam", label: "Mua sắm" },
  { id: "luutru", label: "Lưu trú" },
  { id: "dichvu", label: "Dịch vụ chung" },
];

export default function TrangQuanTri() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dulich");
  const [checkedAuth, setCheckedAuth] = useState(false);

  const bodyRef = useRef(null);

  // Map tab -> component (memo để render ổn định)
  const tabComponentMap = useMemo(
    () => ({
      dulich: <FormDuLich />,
      anuong: <FormAnUong />,
      muasam: <FormMuaSam />,
      luutru: <FormLuuTru />,
      dichvu: <FormDichVu />,
    }),
    []
  );

  /* ===============================
     GUARD ĐĂNG NHẬP (tránh flicker)
  =============================== */
  useEffect(() => {
    const ok = adminAuth.isLoggedIn();
    setCheckedAuth(true);
    if (!ok) navigate("/dang-nhap", { replace: true });
  }, [navigate]);

  /* ===============================
     ĐĂNG XUẤT
  =============================== */
  const handleLogout = () => {
    adminAuth.logout();
    navigate("/dang-nhap", { replace: true });
  };

  /* ===============================
     Đổi tab => scroll lên đầu nội dung
  =============================== */
  const handleChangeTab = (id) => {
    setActiveTab(id);
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  // Nếu chưa check auth xong thì không render (tránh nháy UI)
  if (!checkedAuth) return null;

  return (
    <main
      style={{
        background:
          "linear-gradient(180deg, #C5ECFF 0%, #FFFFFF 40%, #E7F3FF 75%, #FFFFFF 100%)",
        minHeight: "calc(100vh - 56px)",
        padding: "clamp(14px, 2.2vw, 28px)",
        boxSizing: "border-box",
      }}
    >
      {/* ===== HEADER ===== */}
<div
  style={{
    maxWidth: 1200,
    margin: "0 auto 16px",
    background:
      "linear-gradient(90deg, #0ea5e9 0%, #3b82f6 45%, #1d4ed8 100%)",
    color: "#ffffff",
    borderRadius: 20,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    boxShadow: "0 14px 30px rgba(59,130,246,0.30)",
  }}
>
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <span style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
      WebGIS Du lịch – Văn hoá – Ẩm thực tỉnh An Giang
    </span>
    <span style={{ fontSize: 12, opacity: 0.95 }}>
      Khu vực quản trị (CRUD dữ liệu)
    </span>
  </div>

  <button
    onClick={handleLogout}
    style={{
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.35)",
      background: "rgba(255,255,255,0.18)",
      color: "#ffffff",
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
      whiteSpace: "nowrap",
      backdropFilter: "blur(6px)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.28)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.18)";
    }}
  >
    Đăng xuất
  </button>
</div>


      {/* ===== BODY ===== */}
      <div
        ref={bodyRef}
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 26,
          boxShadow:
            "0 20px 40px rgba(135,206,235,0.22), 0 8px 20px rgba(15,23,42,0.10)",
          border: "1px solid #D3E3FC",
          padding: "clamp(14px, 2vw, 24px)",
          boxSizing: "border-box",
        }}
      >
        {/* ===== TAB BAR (sticky) ===== */}
        <div
          style={{
            position: "sticky",
            top: 8,
            zIndex: 5,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(6px)",
            padding: "10px 0 12px",
            borderBottom: "1px solid #eef2ff",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {TABS.map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  onClick={() => handleChangeTab(t.id)}
                  style={{
                    borderRadius: 999,
                    border: active ? "none" : "1px solid #e5e7eb",
                    padding: "9px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                    background: active
                      ? "linear-gradient(135deg, #00BFFF, #0090D9)"
                      : "#f3f4f6",
                    color: active ? "#ffffff" : "#111827",
                    fontWeight: active ? 700 : 600,
                    boxShadow: active ? "0 6px 15px rgba(37,99,235,0.25)" : "none",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== FORM CRUD ===== */}
        <div style={{ width: "100%" }}>
          {tabComponentMap[activeTab] || null}
        </div>
      </div>
    </main>
  );
}
