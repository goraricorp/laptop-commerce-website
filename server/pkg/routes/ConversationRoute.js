// routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/ConversationController');
const axios = require("axios");
const AuthenticationMiddleware = require("../middleware/AuthenticationMiddleware");

// routes.use(express.static(path.join(__dirname, 'client/public')));

router.get('/get-history', AuthenticationMiddleware, ConversationController.getHistory);
router.post('/send-message', AuthenticationMiddleware, ConversationController.requestMessage);
router.post("/chat", AuthenticationMiddleware,ConversationController.responseMessage);
module.exports = router;
