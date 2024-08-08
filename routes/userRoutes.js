const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
  signup,
  login,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController/userController");

const router = express.Router();

router.post("/signup", upload.single("pic"), signup);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);

router.put("/updateuser/:id", authMiddleware, updateUser);

router.delete("/deleteuser/:id", authMiddleware, deleteUser);

router.post("/resetpassword/:token", resetPassword);
module.exports = router;
