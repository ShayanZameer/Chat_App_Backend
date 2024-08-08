const express = require("express");
const userRoutes = require("./routes/userRoutes");

const dotenv = require("dotenv");
const connectDb = require("./config/database");
const cors = require("cors");
dotenv.config();
const PORT = process.env.PORT;

connectDb();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Api is running");
});

app.listen(PORT, () => {
  console.log(`backend is running at port ${PORT} `);
});
