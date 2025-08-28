import express from "express";
import upload from "../middlewares/multerconfig.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

import {
  register,
  login,
  logout,
  updateProfile,
  getProfile,
  refreshToken,
  getUserStatistics,
  getReadingHistory,
  addToReadingHistory,
  getUserBadges,
  verifyEmail,
  generateVerificationCode,
  verifyCode,
  sendVerificationCode,
} from "../controllers/user.controller.js";

const router = express.Router();

// ===== PUBLIC ROUTES =====

// Register user
router.post("/register", register);

// Email verification (via token in URL)
router.get("/verify-email/:token", verifyEmail);

// Email verification code (OTP style)
router.post("/generate-code", generateVerificationCode);
router.post("/verify-code", verifyCode);
router.post("/send-code", sendVerificationCode);

// Login / Logout
router.post("/login", login);
router.post("/logout", logout);

// ===== AUTHENTICATED ROUTES =====

// Refresh JWT token
router.post("/refresh-token", isAuthenticated, refreshToken);

// Get user profile
router.get("/me", isAuthenticated, getProfile);

// Update user profile (optional profile picture upload)
router.put(
  "/profile/update",
  isAuthenticated,
  upload.single("profilePicture"),
  updateProfile
);

// User statistics
router.get("/statistics", isAuthenticated, getUserStatistics);

// Reading history
router.get("/reading-history", isAuthenticated, getReadingHistory);
router.post(
  "/reading-history/:articleId",
  isAuthenticated,
  addToReadingHistory
);

// User badges
router.get("/badges", isAuthenticated, getUserBadges);

export default router;
