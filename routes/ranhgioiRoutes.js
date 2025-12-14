// routes/ranhgioiRoutes.js
const express = require('express');
const router = express.Router();
const ranh = require('../controllers/ranhgioiController');

router.get('/ranhgioi', ranh.getRanhGioiAG);

module.exports = router;
