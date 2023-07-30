const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");

const { ensureAuth } = require("../middleware/auth");
const { ensureSignUp, ensureCreator } = require("../middleware/user");

const Post = mongoose.model("posts");
const User = mongoose.model("users");
const Comment = mongoose.model("comments");
const Like = mongoose.model("likes");

const router = express.Router();

router.get(
  "/create/post",
  ensureAuth,
  ensureSignUp,
  ensureCreator,
  (req, res) => {
    res.render("create-post");
  }
);

router.post(
  "/create/post",
  ensureAuth,
  ensureSignUp,
  ensureCreator,
  async (req, res) => {
    try {
      const user = req.user;
      const post = await Post.create({
        ...req.body,
        userID: user._id,
      });
      console.log(post);

      res.status(200).send(post);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        error: "Something went wrong",
      });
    }
  }
);

router.get("/post/:id", ensureAuth, async (req, res) => {
  const postID = req.params.id;
  try {
    const post = await Post.findById(postID);
    if (!post) {
      return res.redirect("/post-not-found"); // Take user to 404 page
    }
    const author = await User.findById(post.userID);
    const postDate = moment(post.createdAt).format("dddd, MMMM Do YYYY");

    const comments = await Comment.find({ postID: postID, depth: 1 });

    let likeDoc = await Like.findOne({ userID: post.userID, postID: postID });
    let temp = false;
    if (likeDoc) temp = true;
    res.locals.liked = temp;

    res.locals.post = post;
    res.locals.comments = comments;
    res.locals.author = author;
    res.locals.postDate = postDate;

    res.render("post");
  } catch (error) {
    console.log(error);
    res.render("error-500");
  }
});

router.patch("/post/like", ensureAuth, async (req, res) => {
  const id = req.body.id;
  try {
    const post = await Post.findById(id);
       
    post.likes += 1;
    await post.save();

    const like = await Like.create({
      userID: req.user.googleID,
      postID: id,
    });
    console.log(like);
    res.status(200).json({});
  } catch (error) {
    console.log(error);
    res.status(400).json({});
  }
});

module.exports = router;
