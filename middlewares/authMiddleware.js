const jwt = require("jsonwebtoken");

const User = require("../Models/userModel");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    console.log("token is", token);

    if (!token) {
      res.status(400).json({ message: "Access Denied , No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(400).json({ message: "User Not found" });
    }

    req.user = user;

    console.log("req.user", req.user);
    next();
  } catch (error) {
    res.status(400).json({ message: "Server error", error: error.message });
  }
};

module.exports = authMiddleware;
