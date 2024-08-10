const User = require("../../Models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();
const cloudinary = require("../../config/Cloudinary/cloudinary");

const { sendEmail } = require("../../config/sendingMail/sendingMail");

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const uploadToCloudinary = async (file) => {
  const adjustedTimestamp = Math.floor(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp: adjustedTimestamp },
    process.env.CLOUDINARY_API_SECRET
  );

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          timestamp: adjustedTimestamp,
          signature,
          api_key: process.env.CLOUDINARY_API_KEY,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      )
      .end(file.buffer);
  });
};

exports.signup = async (req, res) => {
  try {
    console.log("helo");
    const { name, email, password, confirmPassword, role } = req.body;
    let pic;
    try {
      const cloudinaryUrl = await uploadToCloudinary(req.file);

      console.log(cloudinaryUrl);
      pic = cloudinaryUrl;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }

    const existingUser = await User.findOne({ email });

    console.log("hey");

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already in use, User already exists" });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password and confirm password donot match" });
    }

    const newUser = new User({
      name,
      email,
      password,
      confirmPassword,
      pic,
      role,
    });
    await newUser.save();

    const token = createToken(newUser._id);

    res.status(201).json({
      token,
      user: { name: newUser.name, email: newUser.email, pic: newUser.pic },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = createToken(user._id);

    res.status(200).json({
      message: "Login successfully",
      token,
      user: {
        name: user.name,
        email: user.email,
        userId: user._id,
        pic: user.pic,
      },
    });
  } catch (error) {
    res.status(400).json({ message: "Server error", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const updates = req.body;

    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      updates.password = hashedPassword;
    }

    const user = await User.findByIdAndUpdate(id, updates);

    if (!user) {
      return res.status(400).json({ message: "User not Found" });
    }

    res.status(200).json({ message: "User Update Succssfully" });
  } catch (error) {
    res.status(400).json({ message: "Server error", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(400).json({ message: "User not Found" });
    }
    res.status(200).json({ message: "User deleted Succssfully" });
  } catch (error) {
    res.status(400).json({ message: "Server Error", error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // console.log("email is ", email);

    const user = await User.findOne({ email });
    console.log("user is ", user);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenExpiration = Date.now() + 3600000;

    user.token = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    console.log("user si ", user);

    const resetLink = `${process.env.HOST}/resetpassword/${resetToken}`;

    const emailSubject = "Password Reset Request";
    const emailText = `Hi ${user.name},\n\nPlease click the following link to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`;
    const emailHtml = `<p>Hi ${user.name},</p><p>Please click the following link to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>If you did not request this, please ignore this email.</p>`;

    await sendEmail(
      process.env.SENDING_EMAIL,
      user.email,
      emailSubject,
      emailText,
      emailHtml
    );

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    res.status(400).json({ message: "Server error", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const { password, confirmPassword } = req.body;

    // Ensure passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const user = await User.findOne({
      token: token,
      resetTokenExpiration: { $gt: Date.now() },
    }).select("+password");

    console.log("USER IS ", user);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password

    console.log("user.passord before is ", user.password);

    // Update user's password and clear the token and expiration
    user.password = password;

    console.log("user.passord after is ", user.password);
    user.token = undefined;
    user.resetTokenExpiration = undefined;

    // Save the updated user to the database
    await user.save();

    res.status(200).json({ message: "Password updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            {
              name: { $regex: req.query.search, $options: "i" },
            },
            {
              email: { $regex: req.query.search, $options: "i" },
            },
          ],
        }
      : {};

    const users = await User.find(keyword);

    res.status(200).json(users);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Internal Server error", error: error.message });
  }
};
