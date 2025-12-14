// src/pages/TrangBanDo.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import MapComponent from "../components/ban_do/MapComponent";

export default function TrangBanDo() {
  const location = useLocation();

  const { tab: initialTabFromData, gid: initialGidFromData } =
    location.state || {};

  const searchParams = new URLSearchParams(location.search);
  const initialLayerKey = searchParams.get("layer") || null;
  const initialTabFromQuery = searchParams.get("tab") || null;

  const resolvedInitialTab = initialTabFromQuery || initialTabFromData || undefined;

  const handleExportMap = () => {
    const evt = new Event("exportMap");
    window.dispatchEvent(evt);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh - 56px)",
        padding: "10px 12px",
        boxSizing: "border-box",

        /* ⭐ TONE MÀU MỚI GIỐNG TrangChu.jsx */
        background:
          "linear-gradient(180deg, #C5ECFF 0%, #FFFFFF 45%, #E7F3FF 75%, #FFFFFF 100%)",

        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          height: "100%",
          borderRadius: 20,
          overflow: "hidden",

          /* ⭐ Shadow mềm giống TrangChu.jsx */
          boxShadow:
            "0 20px 40px rgba(135,206,235,0.25), 0 8px 20px rgba(15,23,42,0.08)",

          /* ⭐ Border xanh nhạt đồng bộ giao diện */
          border: "1px solid #D3E3FC",

          /* ⭐ Nền sáng giống card trong TrangChu */
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* MAP & SIDEBAR */}
        <MapComponent
          initialTab={resolvedInitialTab}
          initialSelectedGid={initialGidFromData}
          initialLayerKey={initialLayerKey}
        />

        {/* FLOAT BUTTON EXPORT MAP */}
        <button
          onClick={handleExportMap}
          title="Tải bản đồ"
          style={{
            position: "absolute",
            right: 20,
            bottom: 20,
            zIndex: 1000,
            width: 48,
            height: 48,
            borderRadius: "999px",
            border: "none",

            /* ⭐ Gradient màu xanh du lịch đồng bộ */
            background:
              "linear-gradient(135deg, #00BFFF 0%, #0090D9 45%, #0074B8 100%)",

            color: "#ffffff",
            boxShadow: "0 8px 18px rgba(15,23,42,0.35)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            outline: "none",
            transition: "transform 0.05s ease, box-shadow 0.15s ease",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(1px) scale(0.96)";
            e.currentTarget.style.boxShadow =
              "0 4px 10px rgba(15,23,42,0.25)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow =
              "0 8px 18px rgba(15,23,42,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow =
              "0 8px 18px rgba(15,23,42,0.35)";
          }}
        >
          📷
        </button>
      </div>
    </div>
  );
}
