const express = require("express");
const router = express.Router();
const UserModel = require("../models/UserModel");
const FollowerModel = require("../models/FollowerModel");
const ChatModel = require("../models/ChatModel");
const NotificationModel = require("../models/NotificationModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const isEmail = require("validator/lib/isEmail");
const authMiddleware = require("../middleware/authMiddleware");

// RETRIEVE USER INFO FROM DATABASE
router.get("/", authMiddleware, async (req, res) => {
  const { userId } = req;

  try {
    const user = await UserModel.findById(userId);
    const userFollowStats = await FollowerModel.findOne({ user: userId });
    return res.status(200).json({ user, userFollowStats });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// USER LOG IN
router.post("/", async (req, res) => {
  const { email, password } = req.body.user;

  // Return 401 if email is not valid
  if (!isEmail(email)) {
    return res.status(401).send("Invalid email");
  }

  // Return 401 if password is not valid
  if (password.length < 6) {
    return res.status(401).send("Password must be at least 6 characters");
  }

  try {
    // Select only the password field
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    // Return 401 if no matched user is found
    if (!user) {
      return res.status(401).send("Invalid credentials");
    }

    // Return 401 if password is incorrect
    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.status(401).send("Invalid credentials");
    }

    // Add notification model for pre-existing users
    const notificationModel = await NotificationModel.findOne({
      user: user._id,
    });

    if (!notificationModel) {
      await new NotificationModel({ user: user._id, notifications: [] }).save();
    }

    // Add chat model for pre-existing users
    const chatModel = await ChatModel.findOne({
      user: user._id,
    });

    if (!chatModel) {
      await new ChatModel({ user: user._id, chats: [] }).save();
    }

    // Send back to front end
    const payload = { userId: user._id };
    jwt.sign(
      payload,
      process.env.jwtSecret,
      { expiresIn: "2d" },
      (err, token) => {
        if (err) throw err;
        res.status(200).json(token);
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
