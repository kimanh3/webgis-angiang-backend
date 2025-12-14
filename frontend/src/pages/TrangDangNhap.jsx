// src/pages/TrangDangNhap.jsx
import React from "react";
import DangNhapQuanTri from "../components/quan_tri/DangNhapQuanTri";

export default function TrangDangNhap() {
  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",

        /* ⭐ Gradient nền giống TrangChu & TrangBanDo */
        background:
          "linear-gradient(180deg, #C5ECFF 0%, #FFFFFF 40%, #E7F3FF 75%, #FFFFFF 100%)",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        boxSizing: "border-box",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 26,
          background: "#FFFFFF",

          /* ⭐ Shadow xanh nhạt đồng bộ toàn hệ thống */
          boxShadow:
            "0 20px 40px rgba(135,206,235,0.24), 0 8px 20px rgba(15,23,42,0.08)",

          border: "1px solid #D3E3FC",
          padding: "32px 28px",
          boxSizing: "border-box",
        }}
      >
        {/* TIÊU ĐỀ ĐĂNG NHẬP */}
        <h1
          style={{
            textAlign: "center",
            marginBottom: 20,
            fontSize: 20,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          Đăng nhập quản trị hệ thống WebGIS
        </h1>

        {/* FORM */}
        <DangNhapQuanTri />
      </div>
    </main>
  );
}
