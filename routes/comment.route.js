import express from "express";
import {
  addComment,
  getComments,
  upvoteComment,
  deleteComment,
  downvoteComment,
  editComment,
  reportComment
} from "../controllers/comment.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Add a comment to an article
router.post("/:articleId", isAuthenticated, addComment);

// Get comments for an article
router.get("/:articleId", getComments);

// Upvote a specific comment
router.patch("/:articleId/:commentId/upvote", isAuthenticated, upvoteComment);

// Edit a specific comment
router.patch("/:articleId/:commentId", isAuthenticated, editComment);

// Delete a specific comment
router.delete("/:articleId/:commentId", isAuthenticated, deleteComment);

// Downvote a specific comment
router.patch("/:articleId/:commentId/downvote", isAuthenticated, downvoteComment);

// Report a specific comment
router.post("/:articleId/:commentId/report", isAuthenticated, reportComment);

export default router;
