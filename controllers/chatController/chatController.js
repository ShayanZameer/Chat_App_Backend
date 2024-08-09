const Chat = require("../../Models/chatModel");
const User = require("../../Models/userModel");

exports.createChat = async (req, res) => {
  try {
    const { chatName, users, isGroupChat, groupAdmin, latestMessage } =
      req.body;

    const loggedInUserId = req.user._id;
    console.log("loggedInUSer is ", loggedInUserId);

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
    console.log("log in user", loggedInUserId);

    const chats = await Chat.find({
      users: { $elemMatch: { $eq: loggedInUserId } },
    })
      .populate("users", "name email")
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

    console.log("chat Name is ", chatName);

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
    console.log("hello ", chat.chatName);
    await chat.save();

    res.status(200).json({ message: "Name updated successfully", chat });
  } catch (error) {
    res.status(400).json({ message: "internal server", error: error.message });
  }
};
