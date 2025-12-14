// src/components/quan_tri/DangNhapQuanTri.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, adminAuth } from "../../api/adminApi";

export default function DangNhapQuanTri() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Nếu đã đăng nhập thì chuyển thẳng vào /admin
  useEffect(() => {
    if (adminAuth.isLoggedIn()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    setLoading(true);

    try {
      const credentials = {
        username: (username || "").trim(),
        password: password || "",
      };

      // adminLogin() đã tự saveToken + saveUser (đồng nhất toàn hệ thống)
      const res = await adminLogin(credentials);

      if (!res?.token) {
        throw new Error("❌ Đăng nhập thất bại: không nhận được token.");
      }

      setIsError(false);
      setMessage("✅ Đăng nhập thành công.");
      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      setIsError(true);
      setMessage(
        err?.message ||
          "❌ Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản / mật khẩu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="admin-login-form"
      onSubmit={handleSubmit}
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        padding: 24,
        borderRadius: 24,
        border: "1px solid #D3E3FC",
        boxShadow:
          "0 20px 40px rgba(135,206,235,0.24), 0 8px 20px rgba(15,23,42,0.10)",
        background:
          "radial-gradient(circle at 0% 0%, #E3F1FF 0%, #FFFFFF 55%, #E7F3FF 100%)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "#00A2E8",
          marginBottom: 4,
        }}
      >
        An Giang Tourism WebGIS
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        Đăng nhập quản trị
      </h2>

      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Khu vực dành cho <strong>quản trị hệ thống</strong>
      </p>

      {message && (
        <p
          style={{
            marginBottom: 12,
            fontSize: 13,
            padding: "8px 10px",
            borderRadius: 10,
            backgroundColor: isError ? "#fee2e2" : "#dcfce7",
            color: isError ? "#b91c1c" : "#166534",
            border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
          }}
        >
          {message}
        </p>
      )}

      <label style={{ display: "block", marginBottom: 10 }}>
        Tài khoản
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          autoComplete="username"
          style={{
            width: "100%",
            marginTop: 4,
            padding: "9px 12px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            opacity: loading ? 0.8 : 1,
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 16 }}>
        Mật khẩu
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
          style={{
            width: "100%",
            marginTop: 4,
            padding: "9px 12px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            opacity: loading ? 0.8 : 1,
          }}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "9px 16px",
          borderRadius: 999,
          border: "none",
          background: loading
            ? "#9ca3af"
            : "linear-gradient(135deg, #00BFFF, #0074B8)",
          color: "#fff",
          fontWeight: 600,
          fontSize: 14,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <p
        style={{
          marginTop: 10,
          fontSize: 11,
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        * Tài khoản do giảng viên / quản trị hệ thống cấp
      </p>
    </form>
  );
}
