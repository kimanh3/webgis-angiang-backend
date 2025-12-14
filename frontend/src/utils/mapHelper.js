// src/utils/mapHelper.js

// Tự tính bounding box từ FeatureCollection rồi fitBounds lên map
export const fitFeatureCollection = (map, featureCollection) => {
  if (
    !map ||
    !featureCollection ||
    !Array.isArray(featureCollection.features) ||
    featureCollection.features.length === 0
  ) {
    return;
  }

  // Giá trị khởi tạo để tìm min/max
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  const addCoord = (coord) => {
    if (!coord || coord.length < 2) return;
    const [lng, lat] = coord; // GeoJSON: [lng, lat]
    if (typeof lat !== "number" || typeof lng !== "number") return;

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  };

  featureCollection.features.forEach((f) => {
    const g = f.geometry;
    if (!g || !g.coordinates) return;

    switch (g.type) {
      case "Point":
        addCoord(g.coordinates);
        break;

      case "MultiPoint":
      case "LineString":
        g.coordinates.forEach(addCoord);
        break;

      case "MultiLineString":
      case "Polygon":
        // Polygon: [ [ [lng,lat], ... ] ]
        g.coordinates.flat().forEach(addCoord);
        break;

      case "MultiPolygon":
        // MultiPolygon: [ [ [ [lng,lat], ... ] ] ]
        g.coordinates.flat(2).forEach(addCoord);
        break;

      default:
        break;
    }
  });

  // Nếu không tìm được toạ độ hợp lệ thì thôi
  if (
    minLat === 90 ||
    maxLat === -90 ||
    minLng === 180 ||
    maxLng === -180
  ) {
    return;
  }

  // Dùng trực tiếp map.fitBounds, không cần window.L
  map.fitBounds(
    [
      [minLat, minLng],
      [maxLat, maxLng],
    ],
    { padding: [20, 20] }
  );
};
