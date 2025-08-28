import express from "express";
import {
  markArticleAsViewed,
  createArticleWithoutView,
  likeArticle,
  bookmarkArticle,
  getBookmarks,
  getHistory,
  getLikes,
  getFeaturedArticles,
} from "../controllers/article.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post("/view", isAuthenticated, markArticleAsViewed);
router.post("/create", isAuthenticated, createArticleWithoutView);
router.patch("/like", isAuthenticated, likeArticle);
router.patch("/bookmark", isAuthenticated, bookmarkArticle);
router.get("/likes", isAuthenticated, getLikes);
router.get("/bookmarks", isAuthenticated, getBookmarks);
router.get("/history", isAuthenticated, getHistory);
router.get("/featured", getFeaturedArticles); // No authentication required for featured articles

export default router;