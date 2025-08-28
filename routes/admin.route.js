import express from "express";
import {
  adminLogin,
  adminLogout,
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  deleteUser,
  getSystemHealth,
  getAnalytics
} from "../controllers/admin.controller.js";
import isAdmin from "../middlewares/isAdmin.js";

const router = express.Router();

// Admin login (no middleware needed)
router.post("/login", adminLogin);
router.post("/logout", adminLogout);

// Protected admin routes
router.get("/dashboard", isAdmin, getDashboardStats);
router.get("/users", isAdmin, getAllUsers);
router.get("/users/:userId", isAdmin, getUserDetails);
router.delete("/users/:userId", isAdmin, deleteUser);
router.get("/system-health", isAdmin, getSystemHealth);
router.get("/analytics", isAdmin, getAnalytics);

export default router;
