const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");

const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ messsgae: "Token or  not found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_Secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: "User Not found" });
    }

    if (user.role !== "admin") {
      return res
        .status(400)
        .json({
          message: "You are not admin you donot have access to this resource",
        });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = isAdmin;
