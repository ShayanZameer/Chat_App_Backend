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
    const chatId = req.params.chatId;
    console.log("Chat ID:", chatId);

    // Find the chat document by chatId
    const chat = await Chat.findById(chatId).populate("messages");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Extract the message IDs from the chat document
    const messageIds = chat.messages;

    // Retrieve the messages from the Message collection
    const messages = await Message.find({ _id: { $in: messageIds } })
      .populate("sender", "name email") // Populate sender details
      .sort({ createdAt: 1 }); // Sort messages by creation date

    // Return the messages to the client
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(400)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.saveMessagesOnDisconnect = async (req, res) => {
  const { chatId, messages } = req.body;

  if (!chatId || !messages || messages.length === 0) {
    return res
      .status(400)
      .json({ message: "Chat ID and messages are required" });
  }

  try {
    // Fetch existing chat
    const chat = await Chat.findById(chatId).populate("messages");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Extract existing message IDs
    const existingMessageIds = chat.messages.map((msg) => msg._id.toString());

    // Filter new messages (messages that are not already in the database)
    const newMessages = messages.filter(
      (msg) => !existingMessageIds.includes(msg._id)
    );

    // Insert new messages
    const createdMessages = await Message.insertMany(newMessages);

    // Get the message IDs from the created messages
    const messageIds = createdMessages.map((msg) => msg._id);

    // Update the chat with new messages and latest message
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: { $each: messageIds } },
        latestMessage: messageIds[messageIds.length - 1],
      },
      { new: true }
    )
      .populate("users", "name email pic")
      .populate("latestMessage");

    res.status(200).json({
      message: "Messages saved successfully",
      chat: updatedChat,
    });
  } catch (error) {
    console.error("Error saving messages:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// exports.saveMessagesOnDisconnect = async (req, res) => {
//   const { chatId, messages } = req.body;

//   if (!chatId || !messages || messages.length === 0) {
//     return res
//       .status(400)
//       .json({ message: "Chat ID and messages are required" });
//   }

//   try {
//     const createdMessages = await Message.insertMany(messages);

//     // Get the message IDs from the created messages
//     const messageIds = createdMessages.map((msg) => msg._id);

//     const updatedChat = await Chat.findByIdAndUpdate(
//       chatId,
//       {
//         $push: { messages: { $each: messageIds } },
//         latestMessage: messageIds[messageIds.length - 1],
//       },
//       { new: true }
//     )
//       .populate("users", "name email pic")
//       .populate("latestMessage");

//     res.status(200).json({
//       message: "Messages saved successfully",
//       chat: updatedChat,
//     });
//   } catch (error) {
//     console.error("Error saving messages:", error);

//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };
