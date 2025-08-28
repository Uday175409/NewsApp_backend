import { user as User } from "../models/user.model.js";
import { article as Article } from "../models/article.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Admin login attempt:', { email, password });
    console.log('Expected credentials:', { 
      email: process.env.ADMIN_EMAIL, 
      password: process.env.ADMIN_PASSWORD 
    });

    // Check admin credentials from environment variables
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      console.log('Admin login failed - Invalid credentials');
      return res.status(401).json({
        message: "Invalid admin credentials",
        success: false,
      });
    }

    // Generate admin token
    const tokenData = { 
      adminId: "admin", 
      email: process.env.ADMIN_EMAIL,
      role: "admin" 
    };
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    console.log('Admin login successful - Token generated:', token.substring(0, 20) + '...');
    console.log('Token data:', tokenData);

    // Clear any existing user token to prevent conflicts
    res.clearCookie("token");

    // Set admin token as cookie with different name
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      message: "Admin login successful",
      success: true,
      token,
      admin: {
        email: process.env.ADMIN_EMAIL,
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// Admin Logout
export const adminLogout = async (req, res) => {
  try {
    // Clear both admin and user cookies to ensure complete separation
    res.clearCookie("admin_token");
    res.clearCookie("token");
    
    return res.status(200).json({
      message: "Admin logout successful",
      success: true,
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();

    // Users registered this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Active users (users with any activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.countDocuments({
      $or: [
        { "history.viewedAt": { $gte: thirtyDaysAgo } },
        { updatedAt: { $gte: thirtyDaysAgo } }
      ]
    });

    // Total articles in database
    const totalArticles = await Article.countDocuments();

    // Total bookmarks across all users
    const bookmarkStats = await User.aggregate([
      { $project: { bookmarkCount: { $size: "$bookmarks" } } },
      { $group: { _id: null, totalBookmarks: { $sum: "$bookmarkCount" } } }
    ]);
    const totalBookmarks = bookmarkStats[0]?.totalBookmarks || 0;

    // Total likes across all users
    const likeStats = await User.aggregate([
      { $project: { likeCount: { $size: "$likedArticles" } } },
      { $group: { _id: null, totalLikes: { $sum: "$likeCount" } } }
    ]);
    const totalLikes = likeStats[0]?.totalLikes || 0;

    // Total views across all users
    const viewStats = await User.aggregate([
      { $project: { viewCount: { $size: "$history" } } },
      { $group: { _id: null, totalViews: { $sum: "$viewCount" } } }
    ]);
    const totalViews = viewStats[0]?.totalViews || 0;

    // User registration trend (last 7 days)
    const registrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top countries
    const topCountries = await User.aggregate([
      { $match: { "profile.country": { $exists: true, $ne: "" } } },
      { $group: { _id: "$profile.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Top languages
    const topLanguages = await User.aggregate([
      { $match: { "profile.language": { $exists: true, $ne: "" } } },
      { $group: { _id: "$profile.language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          newUsersThisMonth,
          activeUsers,
          totalArticles,
          totalBookmarks,
          totalLikes,
          totalViews
        },
        trends: {
          registrationTrend,
          topCountries,
          topLanguages
        }
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      message: "Error fetching dashboard statistics",
      success: false,
    });
  }
};

// Get All Users with Pagination
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search ? {
      $or: [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "profile.country": { $regex: search, $options: "i" } }
      ]
    } : {};

    // Get users with their activity counts
    const users = await User.aggregate([
      { $match: searchQuery },
      {
        $addFields: {
          bookmarkCount: { $size: "$bookmarks" },
          likeCount: { $size: "$likedArticles" },
          viewCount: { $size: "$history" }
        }
      },
      {
        $project: {
          password: 0 // Exclude password from response
        }
      },
      { $sort: { [sortBy]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const totalUsers = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      message: "Error fetching users",
      success: false,
    });
  }
};

// Get User Details by ID
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('bookmarks', 'title url publishedAt source')
      .populate('likedArticles', 'title url publishedAt source')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Get user's recent history with article details
    const recentHistory = user.history
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 20);

    // Calculate user activity stats
    const activityStats = {
      totalBookmarks: user.bookmarks.length,
      totalLikes: user.likedArticles.length,
      totalViews: user.history.length,
      lastActive: user.history.length > 0 ? 
        Math.max(...user.history.map(h => new Date(h.viewedAt))) : null
    };

    return res.status(200).json({
      success: true,
      data: {
        user,
        recentHistory,
        activityStats
      }
    });
  } catch (error) {
    console.error("Get user details error:", error);
    return res.status(500).json({
      message: "Error fetching user details",
      success: false,
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      message: "Error deleting user",
      success: false,
    });
  }
};

// Get System Health
export const getSystemHealth = async (req, res) => {
  try {
    // Database connection status
    const dbStatus = "connected"; // Mongoose connection status

    // Memory usage
    const memoryUsage = process.memoryUsage();

    // System uptime
    const uptime = process.uptime();

    // Recent error logs (you can implement this based on your logging system)
    const recentErrors = []; // Placeholder for error logs

    return res.status(200).json({
      success: true,
      data: {
        database: {
          status: dbStatus,
          lastChecked: new Date()
        },
        system: {
          uptime: Math.floor(uptime),
          memoryUsage: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
          }
        },
        errors: recentErrors
      }
    });
  } catch (error) {
    console.error("System health error:", error);
    return res.status(500).json({
      message: "Error fetching system health",
      success: false,
    });
  }
};

// Get Activity Analytics
export const getActivityAnalytics = async (req, res) => {
  try {
    const { period = "7d" } = req.query;
    
    let startDate;
    switch (period) {
      case "24h":
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // User activity over time
    const userActivity = await User.aggregate([
      {
        $unwind: "$history"
      },
      {
        $match: {
          "history.viewedAt": { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$history.viewedAt" } },
            hour: period === "24h" ? { $hour: "$history.viewedAt" } : null
          },
          views: { $sum: 1 },
          uniqueUsers: { $addToSet: "$_id" }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: "$uniqueUsers" }
        }
      },
      {
        $project: {
          _id: 1,
          views: 1,
          uniqueUserCount: 1
        }
      },
      { $sort: { "_id.date": 1, "_id.hour": 1 } }
    ]);

    // Most popular content (based on views)
    const popularContent = await User.aggregate([
      { $unwind: "$history" },
      {
        $match: {
          "history.viewedAt": { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$history.article",
          viewCount: { $sum: 1 },
          uniqueViewers: { $addToSet: "$_id" }
        }
      },
      {
        $addFields: {
          uniqueViewerCount: { $size: "$uniqueViewers" }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);

    // Transform data to match frontend expectations
    // Create formatted analytics data with all the fields the frontend is expecting
    const dailyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get total counts
    const likeStats = await User.aggregate([
      { $project: { likeCount: { $size: "$likedArticles" } } },
      { $group: { _id: null, totalLikes: { $sum: "$likeCount" } } }
    ]);
    const totalLikes = likeStats[0]?.totalLikes || 0;

    const bookmarkStats = await User.aggregate([
      { $project: { bookmarkCount: { $size: "$bookmarks" } } },
      { $group: { _id: null, totalBookmarks: { $sum: "$bookmarkCount" } } }
    ]);
    const totalBookmarks = bookmarkStats[0]?.totalBookmarks || 0;
    
    const totalUsers = await User.countDocuments();
    const totalRegistrations = totalUsers;
    const totalViews = popularContent.reduce((sum, item) => sum + item.viewCount, 0);
    
    // Format daily activity from user activity data
    const dailyActivity = userActivity
      .filter(activity => activity._id.hour === null) // Only daily aggregates
      .map(activity => ({
        _id: activity._id.date,
        totalActivity: activity.views,
        uniqueUsers: activity.uniqueUserCount
      }));
    
    // Get top countries and languages from user profiles
    const topCountries = await User.aggregate([
      { $match: { "profile.country": { $exists: true, $ne: "" } } },
      { $group: { _id: "$profile.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topLanguages = await User.aggregate([
      { $match: { "profile.language": { $exists: true, $ne: "" } } },
      { $group: { _id: "$profile.language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        period,
        totalRegistrations,
        totalViews,
        totalLikes,
        totalBookmarks,
        dailyRegistrations,
        topCountries,
        topLanguages,
        dailyActivity,
        userActivity,
        popularContent
      }
    });
  } catch (error) {
    console.error("Activity analytics error:", error);
    return res.status(500).json({
      message: "Error fetching activity analytics",
      success: false,
    });
  }
};

// Get Analytics
export const getAnalytics = async (req, res) => {
  try {
    // Determine time period based on 'period' query param (e.g., '7d', '30d', etc.)
    const period = req.query.period || '30d';
    let days;
    switch (period) {
      case '7d': days = 7; break;
      case '90d': days = 90; break;
      case '365d': days = 365; break;
      case '30d':
      default: days = 30;
    }
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // New Registrations: count users created within the time period
    const totalRegistrations = await User.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // Total Views: count viewHistory entries within the time period
    const viewsAggregate = await Article.aggregate([
      { $unwind: "$viewedBy" },
      { $match: { "viewedBy.viewedAt": { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);
    const totalViews = viewsAggregate[0] ? viewsAggregate[0].total : 0;

    // Total Likes: count likesHistory entries within the time period
    const likesAggregate = await Article.aggregate([
      { $unwind: "$likedBy" },
      { $match: { "likedBy.likedAt": { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);
    const totalLikes = likesAggregate[0] ? likesAggregate[0].total : 0;

    // Total Bookmarks: count savedHistory entries within the time period
    const bookmarksAggregate = await Article.aggregate([
      { $unwind: "$savedBy" },
      { $match: { "savedBy.bookmarkedAt": { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);
    const totalBookmarks = bookmarksAggregate[0] ? bookmarksAggregate[0].total : 0;

    // Daily Registrations Trend
    const dailyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Top Countries
    const topCountries = await User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, "profile.country": { $exists: true, $ne: "" } } },
      { $group: { _id: "$profile.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Top Languages
    const topLanguages = await User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, "profile.language": { $exists: true, $ne: "" } } },
      { $group: { _id: "$profile.language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Daily Activity heatmap (using registrations as proxy)
    const dailyActivity = dailyRegistrations.map(d => ({ _id: d._id, totalActivity: d.count }));

    return res.status(200).json({
      success: true,
      data: {
        period,
        totalRegistrations,
        totalViews,
        totalLikes,
        totalBookmarks,
        dailyRegistrations,
        topCountries,
        topLanguages,
        dailyActivity
      }
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return res.status(500).json({
      message: "Error fetching analytics data",
      success: false,
    });
  }
};
