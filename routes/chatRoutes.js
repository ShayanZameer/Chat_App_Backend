const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  createChat,
  fetchChats,
  renameGroup,
  removeFromGroup,
  addToGroup,
  saveMessagesOnDisconnect,
} = require("../controllers/chatController/chatController");

const router = express.Router();

router.post("/createchat", authMiddleware, createChat);

router.get("/fetchchats", authMiddleware, fetchChats);
router.put("/renamegroup", authMiddleware, renameGroup);
router.put("/removefromgroup", authMiddleware, removeFromGroup);
router.put("/addtogroup", authMiddleware, addToGroup);

module.exports = router;
