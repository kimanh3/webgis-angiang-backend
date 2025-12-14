// src/components/giao_dien/NutChonNgonNgu.jsx
import React from "react";

export default function NutChonNgonNgu({ lang, onChange }) {
  return (
    <select
      value={lang}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        padding: "4px 8px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        fontSize: 12,
      }}
    >
      <option value="vi">VI</option>
      <option value="en">EN</option>
    </select>
  );
}
