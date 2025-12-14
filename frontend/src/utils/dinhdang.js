// src/utils/dinhdang.js
export const formatNumber = (v) =>
  v == null || v === "" ? "" : Number(v).toLocaleString("vi-VN");

export const formatKm = (m) =>
  m == null ? "" : `${(Number(m) / 1000).toFixed(2)} km`;
