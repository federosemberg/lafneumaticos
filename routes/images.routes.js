// src/routes/images.routes.js
const express = require('express');
const router = express.Router();
const imagesController = require('../controllers/images.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/:file_id', authMiddleware.validateRequest, imagesController.getImage);

module.exports = router;