const Chat = require("../../Models/chatModel");
const User = require("../../Models/userModel");

exports.createChat = async (req, res) => {
  try {
    const { chatName, users, isGroupChat, latestMessage } = req.body;

    const loggedInUserId = req.user._id;
    const groupAdmin = req.user._id;

    if (!chatName || !users) {
      return res
        .status(400)
        .json({ message: "CHAT NAME AND USERS ARE REQUIRED" });
    }

    if (!isGroupChat && users.length > 1) {
      return res.status(400).json({
        message:
          "Single chat can only have one user other than the logged-in user",
      });
    }

    const foundusers = await User.find({ _id: { $in: users } });

    if (foundusers.length !== users.length) {
      res.status(400).json({ message: "one or more users not found" });
    }

    const existingChat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [loggedInUserId, ...users], $size: 2 },
    });

    if (existingChat) {
      return res.status(400).json({
        message: "Chat already exists. Select the existing chat.",
        chat: existingChat,
      });
    }

    const chatData = {
      chatName,
      users: isGroupChat
        ? [...users, loggedInUserId]
        : [loggedInUserId, ...users],
      isGroupChat,
      groupAdmin: isGroupChat ? groupAdmin : null,
      latestMessage: latestMessage || null,
    };

    const chat = await Chat.create(chatData);

    res.status(200).json(chat);
  } catch (error) {
    res
      .status(400)
      .json({ message: "internal server error", error: error.message });
  }
};

exports.fetchChats = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const chats = await Chat.find({
      users: { $elemMatch: { $eq: loggedInUserId } },
    })
      .populate("users", "name email pic")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.renameGroup = async (req, res) => {
  try {
    const { chatId, chatName } = req.body;
    const loggedInUserId = req.user._id;

    if (!chatId || !chatName) {
      return res
        .status(400)
        .json({ message: "chat Id or group name is not present " });
    }

    const chat = await Chat.findOne({ _id: chatId, isGroupChat: true });

    if (!chat) {
      return res.status(400).json({ message: "chat not found " });
    }

    if (!chat.users.includes(loggedInUserId)) {
      return res
        .status(403)
        .json({ message: "You are not part of this group chat." });
    }

    chat.chatName = chatName;
    await chat.save();

    res.status(200).json({ message: "Name updated successfully", chat });
  } catch (error) {
    res.status(400).json({ message: "internal server", error: error.message });
  }
};

exports.removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(400).json({ message: "Chat not found" });
  }
  if (!chat.groupAdmin) {
    return res.status(400).json({ message: "Group admin not defined." });
  }

  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    return res.status(400).json({ message: "Only Admin can delete user" });
  }

  if (!chat.users.includes(userId)) {
    return res.status(400).json({ message: "User Not found in Chat" });
  }

  chat.users = chat.users.filter(
    (user) => user._id.toString() === userId.toString()
  );

  console.log("chat user after performing are", chat.users);

  await chat.save();
  res.status(200).json({ message: "User deleted from group ", chat });
};

exports.addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const user = await User.findById(userId);
    const chat = await Chat.findById(chatId);

    if (!user) {
      return res.status(400).json({ message: "User Not found" });
    }

    if (!chat) {
      return res.status(400).json({ message: "Chat Not found" });
    }
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: "Only Admin can Add new user" });
    }
    if (!chat.isGroupChat) {
      return res.status(400).json({ message: " Group Chat Not found" });
    }

    if (chat.users.includes(userId)) {
      return res.status(400).json({ message: "User already Added" });
    }

    chat.users.push(userId);

    await chat.save();

    res.status(200).json({ message: "User added to Group chat", chat });
  } catch (error) {
    res.status(400).json({ message: "internal server ", error: error.message });
  }
};
