const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const UserModel = require("../models/UserModel");
const ProfileModel = require("../models/ProfileModel");
const FollowerModel = require("../models/FollowerModel");
const PostModel = require("../models/PostModel");
const bcrypt = require("bcryptjs");
const {
  newFollowerNotification,
  removeFollowerNotification,
} = require("../utilsServer/notificationActions");

// GET PROFILE INFO
router.get("/:username", authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await UserModel.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const profile = await ProfileModel.findOne({ user: user._id }).populate(
      "user"
    );
    const profileFollowStats = await FollowerModel.findOne({ user: user._id });

    return res.json({
      profile,
      followersLength:
        profileFollowStats.followers.length > 0
          ? profileFollowStats.followers.length
          : 0,
      followingLength:
        profileFollowStats.following.length > 0
          ? profileFollowStats.following.length
          : 0,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// GET POSTS OF USER
router.get("/posts/:username", authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await UserModel.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const posts = await PostModel.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("user")
      .populate("comments.user");

    return res.json(posts);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// GET FOLLOWERS OF USER
router.get("/followers/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findOne({ user: userId }).populate(
      "followers.user"
    );
    if (!user) {
      return res.status(404).send("User not found");
    }

    return res.json(user.followers);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// GET FOLLOWING OF USER
router.get("/following/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await FollowerModel.findOne({ user: userId }).populate(
      "following.user"
    );
    if (!user) {
      return res.status(404).send("User not found");
    }

    return res.json(user.following);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// FOLLOW A USER
router.post("/follow/:userToFollowId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req;
    const { userToFollowId } = req.params;

    const user = await FollowerModel.findOne({ user: userId });
    const userToFollow = await FollowerModel.findOne({ user: userToFollowId });

    if (!user || !userToFollow) {
      return res.status(404).send("User not found");
    }

    const isFollowing =
      user.following.length > 0 &&
      user.following.filter(
        (following) => following.user.toString() === userToFollowId
      ).length > 0;

    if (isFollowing) {
      return res.status(401).send("User already followed");
    }

    await user.following.unshift({ user: userToFollowId });
    await user.save();

    await userToFollow.followers.unshift({ user: userId });
    await userToFollow.save();

    // Add notification
    await newFollowerNotification(userId, userToFollowId);

    return res.status(200).send("Successfully followed user");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// UNFOLLOW A USER
router.put("/unfollow/:userToUnfollowId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req;
    const { userToUnfollowId } = req.params;

    const user = await FollowerModel.findOne({
      user: userId,
    });

    const userToUnfollow = await FollowerModel.findOne({
      user: userToUnfollowId,
    });

    if (!user || !userToUnfollow) {
      return res.status(404).send("User not found");
    }

    const isFollowing =
      user.following.length > 0 &&
      user.following.filter(
        (following) => following.user.toString() === userToUnfollowId
      ).length === 0;

    if (isFollowing) {
      return res.status(401).send("User not followed before");
    }

    const removeFollowing = await user.following
      .map((following) => following.user.toString())
      .indexOf(userToUnfollowId);

    await user.following.splice(removeFollowing, 1);
    await user.save();

    const removeFollower = await userToUnfollow.followers
      .map((follower) => follower.user.toString())
      .indexOf(userId);

    await userToUnfollow.followers.splice(removeFollower, 1);
    await userToUnfollow.save();

    // Remove notification
    await removeFollowerNotification(userId, userToUnfollowId);

    return res.status(200).send("Successfully unfollowed user");
  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
});

// UPDATE PROFILE
router.post("/update", authMiddleware, async (req, res) => {
  try {
    const { userId } = req;

    const { bio, facebook, youtube, twitter, instagram, profilePicUrl } =
      req.body;

    let profileFields = {};
    profileFields.user = userId;

    profileFields.bio = bio;

    profileFields.social = {};

    if (facebook) profileFields.social.facebook = facebook;

    if (youtube) profileFields.social.youtube = youtube;

    if (instagram) profileFields.social.instagram = instagram;

    if (twitter) profileFields.social.twitter = twitter;

    await ProfileModel.findOneAndUpdate(
      { user: userId },
      { $set: profileFields },
      { new: true }
    );

    if (!profilePicUrl) {
      return res.status(404).send("User not found");
    }

    const user = await UserModel.findById(userId);
    user.profilePicUrl = profilePicUrl;
    await user.save();

    return res.status(200).send("Success updated user profile");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// UPDATE PASSWORD
router.post("/settings/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (newPassword.length < 6) {
      return res.status(400).send("Password must be at least 6 characters");
    }

    const user = await UserModel.findById(req.userId).select("+password");

    const isPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isPassword) {
      return res.status(401).send("Unauthorized request");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).send("Successfully updated password");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// UPDATE MESSAGE POPUP SETTINGS
router.post("/settings/messagePopup", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    if (user.newMessagePopup) {
      user.newMessagePopup = false;
    } else {
      user.newMessagePopup = true;
    }

    await user.save();
    return res.status(200).send("Updated message popup settings");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
