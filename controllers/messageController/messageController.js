const Message = require("../../Models/messageModel");
const Chat = require("../../Models/chatModel");
const User = require("../../Models/userModel");

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const chat = await Chat.findById(chatId);

    if (!content) {
      return res.status(400).json({ message: "Message is empty" });
    }
    if (!chat) {
      return res.status(400).json({ message: "Chat Not Found" });
    }

    const newMessage = {
      sender: req.user._id,
      content: content,
      chat: chatId,
    };

    let message = await Message.create(newMessage);
    message = await message.populate("sender", "name email");
    message = await message.populate("chat");

    message = await User.populate(message, {
      path: "chat.users",
      select: "name email",
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
      $push: { messages: message._id },
    });

    res.json(message);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
exports.getMessages = async (req, res) => {
  try {
    let chatId = req.params.chatId;
    console.log("id is ", chatId);
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email")
      .populate("chat");

    res.status(200).json(messages);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Internal server error", error: error.message });
  }
};
