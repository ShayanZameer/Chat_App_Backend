const express = require("express");

const dotenv = require("dotenv");
const connectDb = require("./config/database");
const cors = require("cors");
const http = require("http");

const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  },
});

dotenv.config();
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const PORT = process.env.PORT;
connectDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);

app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.get("/", (req, res) => {
  res.send("BACKEND DEVELOPED BY SHAYAN ZAMEER AND RUNNING FINE");
});

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("sendMessage", (newMessage) => {
    console.log("Message received on server:", newMessage);
    io.to(newMessage.chatId).emit("messageReceived", newMessage);
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`backend is running at port ${PORT} `);
});
