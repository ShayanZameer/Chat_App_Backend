const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const upload = require("../config/Cloudinary/multer");

const {
  signup,
  login,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
} = require("../controllers/userController/userController");

const router = express.Router();

router.post("/signup", upload.single("pic"), signup);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);

router.put("/updateuser/:id", authMiddleware, updateUser);

router.delete("/deleteuser/:id", authMiddleware, deleteUser);

router.post("/resetpassword/:token", resetPassword);
router.get("/getuser", authMiddleware, getAllUsers);
module.exports = router;
