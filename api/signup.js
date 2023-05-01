const express = require("express");
const router = express.Router();
const UserModel = require("../models/UserModel");
const ProfileModel = require("../models/ProfileModel");
const FollowerModel = require("../models/FollowerModel");
const NotificationModel = require("../models/NotificationModel");
const ChatModel = require("../models/ChatModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const isEmail = require("validator/lib/isEmail");
const regexUserName = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
const userPng =
  "https://res.cloudinary.com/indersingh/image/upload/v1593464618/App/user_mklcpl.png";

// VALIDATE USERNAME INPUT FIELD
router.get("/:username", async (req, res) => {
  const { username } = req.params;

  try {
    // Return 401 if username is not valid
    if (username.length < 1 || !regexUserName.test(username)) {
      return res.status(401).send("Invalid username");
    }

    const user = await UserModel.findOne({ username: username.toLowerCase() });

    // Return 401 if username is already in db
    if (user) {
      return res.status(401).send("Username already taken");
    }

    return res.status(200).send("Username available");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// USER SUBMIT AT SIGNUP PAGE
router.post("/", async (req, res) => {
  const {
    name,
    email,
    username,
    password,
    bio,
    facebook,
    youtube,
    twitter,
    instagram,
  } = req.body.user;

  // Return 401 if email is not valid
  if (!isEmail(email)) {
    return res.status(401).send("Invalid email");
  }

  // Return 401 if password is not valid
  if (password.length < 6) {
    return res.status(401).send("Password must be at least 6 characters");
  }

  try {
    let user;
    user = await UserModel.findOne({ email: email.toLowerCase() });

    // Return 401 if user already exists
    if (user) {
      return res.status(401).send("User already registered");
    }

    // Save the new user object into user model
    user = new UserModel({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      profilePicUrl: req.body.profilePicUrl || userPng,
    });

    user.password = await bcrypt.hash(password, 10);

    await user.save();

    // Save the new user profile into profile model
    let profileFields = {};
    profileFields.user = user._id;
    profileFields.bio = bio;

    profileFields.social = {};
    if (facebook) profileFields.social.facebook = facebook;
    if (youtube) profileFields.social.youtube = youtube;
    if (instagram) profileFields.social.instagram = instagram;
    if (twitter) profileFields.social.twitter = twitter;

    // Set up data models
    await new ProfileModel(profileFields).save();
    await new FollowerModel({
      user: user._id,
      followers: [],
      following: [],
    }).save();
    await new NotificationModel({ user: user._id, notifications: [] }).save();
    await new ChatModel({ user: user._id, chats: [] }).save();

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
