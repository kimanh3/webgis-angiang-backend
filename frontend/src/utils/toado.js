// src/utils/toado.js
export const formatLatLng = (lat, lng) => {
  if (lat == null || lng == null) return "";
  return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
};
