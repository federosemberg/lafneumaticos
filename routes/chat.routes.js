// src/routes/chat.routes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

router.get('/', chatController.handleHttpMessage.bind(chatController));

module.exports = router;

