const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController/messageController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/sendmessage", authMiddleware, sendMessage);
router.get("/getmessages/:chatId", authMiddleware, getMessages);

module.exports = router;
