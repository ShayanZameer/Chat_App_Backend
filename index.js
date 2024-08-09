const express = require("express");

const dotenv = require("dotenv");
const connectDb = require("./config/database");
const cors = require("cors");
dotenv.config();
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const PORT = process.env.PORT;
connectDb();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);

app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.get("/", (req, res) => {
  res.send("Api is running");
});

app.listen(PORT, () => {
  console.log(`backend is running at port ${PORT} `);
});
