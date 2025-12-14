// backend/routes/muasamRoutes.js
const express = require('express');
const router = express.Router();
const muasam = require('../controllers/muasamController');

/**
 * Các route này sẽ được mount dưới prefix /api/angiang
 * trong index.js: app.use('/api/angiang', muasamRoutes);
 *
 * => Đường dẫn thực tế:
 *  - GET    /api/angiang/muasam          (GeoJSON cho bản đồ)
 *  - GET    /api/angiang/muasam/:gid     (xem chi tiết 1 điểm)
 *  - POST   /api/angiang/muasam          (tạo mới)
 *  - PUT    /api/angiang/muasam/:gid     (cập nhật)
 *  - DELETE /api/angiang/muasam/:gid     (xóa)
 */

// 1. Lấy toàn bộ điểm mua sắm (GeoJSON cho bản đồ)
router.get('/muasam', muasam.getDiaDiemMuaSamAG);

// 2. Lấy chi tiết 1 điểm mua sắm theo gid
router.get('/muasam/:gid', muasam.getDiaDiemMuaSamById);

// 3. Tạo mới điểm mua sắm
router.post('/muasam', muasam.createDiaDiemMuaSam);

// 4. Cập nhật điểm mua sắm
router.put('/muasam/:gid', muasam.updateDiaDiemMuaSam);

// 5. Xóa điểm mua sắm
router.delete('/muasam/:gid', muasam.deleteDiaDiemMuaSam);

module.exports = router;
