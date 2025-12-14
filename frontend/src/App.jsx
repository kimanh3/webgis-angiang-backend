// src/App.jsx
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ThanhDieuHuong from "./components/giao_dien/ThanhDieuHuong";

// Các trang chính
import TrangChu from "./pages/TrangChu";
import TrangBanDo from "./pages/TrangBanDo";
import TrangDuLieu from "./pages/TrangDuLieu";
import TrangDangNhap from "./pages/TrangDangNhap";
import TrangQuanTri from "./pages/TrangQuanTri";

import { adminAuth } from "./api/adminApi";

/**
 * Route bảo vệ: chỉ cho vào nếu đã đăng nhập admin
 */
function ProtectedAdminRoute({ children }) {
  const loggedIn = adminAuth.isLoggedIn();

  if (!loggedIn) {
    // ❌ Chưa đăng nhập → chuyển về trang /login
    return <Navigate to="/login" replace />;
  }

  // ✅ Đã đăng nhập → cho phép truy cập
  return children;
}

function App() {
  // Ngôn ngữ giao diện: "vi" | "en"
  const [lang, setLang] = useState("vi");

  return (
    <Router>
      <div
        className="app-shell"
        style={{
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Thanh điều hướng trên cùng – nhận lang + setLang */}
        <ThanhDieuHuong lang={lang} setLang={setLang} />

        {/* Nội dung các trang */}
        <div style={{ flex: 1 }}>
          <Routes>
            {/* Trang chủ giới thiệu */}
            <Route path="/" element={<TrangChu lang={lang} />} />

            {/* Trang bản đồ WebGIS */}
            <Route path="/map" element={<TrangBanDo lang={lang} />} />

            {/* Trang tra cứu dữ liệu (bảng, lọc, tìm kiếm) */}
            <Route path="/data" element={<TrangDuLieu lang={lang} />} />

            {/* Trang đăng nhập admin */}
            <Route path="/login" element={<TrangDangNhap lang={lang} />} />

            {/* Trang quản trị – cần đăng nhập mới vào được */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <TrangQuanTri lang={lang} />
                </ProtectedAdminRoute>
              }
            />

            {/* Nếu route không khớp → đưa về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
