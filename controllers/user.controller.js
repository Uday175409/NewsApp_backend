import { user as User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// GENERATE VERIFICATION CODE ENDPOINT
export const generateVerificationCode = async (req, res) => {
  try {
    console.log("[generateVerificationCode] Request body:", req.body);
    const { email } = req.body;
    if (!email) {
      console.log("[generateVerificationCode] No email provided");
      return res
        .status(400)
        .json({ message: "Email is required", success: false });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.log(
        `[generateVerificationCode] User not found for email: ${email}`
      );
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    if (user.isVerified) {
      console.log(`[generateVerificationCode] User already verified: ${email}`);
      return res
        .status(400)
        .json({ message: "User already verified", success: false });
    }
    if (
      user.verificationCode &&
      user.verificationCodeExpiresAt &&
      user.verificationCodeExpiresAt > Date.now()
    ) {
      console.log(
        `[generateVerificationCode] Code already sent and not expired for user: ${email}`
      );
      return res
        .status(400)
        .json({
          message:
            "A code has already been sent. Please check your email or wait for it to expire.",
          success: false,
        });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expires = new Date(now.getTime() + 10 * 60 * 1000);
    user.verificationCode = code;
    user.verificationCodeGeneratedAt = now;
    user.verificationCodeExpiresAt = expires;
    await user.save();
    console.log(
      `[generateVerificationCode] Generated code ${code} for user ${email}, expires at ${expires}`
    );
    const { sendCodeEmail } = await import("../utils/sendCodeEmail.js");
    await sendCodeEmail(email, code);
    console.log(`[generateVerificationCode] Sent code email to ${email}`);
    return res
      .status(200)
      .json({ message: "Verification code sent to email", success: true });
  } catch (error) {
    console.error("[generateVerificationCode] Error:", error);
    return res
      .status(500)
      .json({ message: "Error sending code", error: error.message });
  }
};

// VERIFY CODE ENDPOINT
export const verifyCode = async (req, res) => {
  try {
    console.log("[verifyCode] Request body:", req.body);
    const { email, code } = req.body;
    if (!email || !code) {
      console.log("[verifyCode] Missing email or code");
      return res
        .status(400)
        .json({ message: "Email and code are required", success: false });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[verifyCode] User not found for email: ${email}`);
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      console.log(`[verifyCode] No code generated for user: ${email}`);
      return res
        .status(400)
        .json({ message: "No code generated for this user", success: false });
    }
    if (user.verificationCodeExpiresAt < Date.now()) {
      console.log(`[verifyCode] Code expired for user: ${email}`);
      return res
        .status(400)
        .json({
          message: "Verification code expired. Please request a new code.",
          success: false,
        });
    }
    if (user.verificationCode !== code) {
      console.log(
        `[verifyCode] Invalid code for user: ${email}. Provided: ${code}, Expected: ${user.verificationCode}`
      );
      return res
        .status(400)
        .json({ message: "Invalid verification code", success: false });
    }
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeGeneratedAt = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();
    console.log(`[verifyCode] Email verified for user: ${email}`);
    return res
      .status(200)
      .json({ message: "Email verified successfully!", success: true });
  } catch (error) {
    console.error("[verifyCode] Error:", error);
    return res
      .status(500)
      .json({ message: "Error verifying code", error: error.message });
  }
};
// import { user as User } from "../models/User.model.js";

// REGISTER
export const register = async (req, res) => {
  try {
    console.log("🔄 USER REGISTER - Starting registration process");
    console.log("📋 Registration data received:", {
      username: req.body.username,
      email: req.body.email,
    });

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      console.log("❌ USER REGISTER - Missing required fields");
      return res.status(400).json({
        message: "All fields are required (username, email, password)",
        success: false,
      });
    }

    console.log("🔍 USER REGISTER - Checking for existing user");
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ USER REGISTER - Email already exists");
      return res.status(400).json({
        message: "Email is already in use",
        success: false,
      });
    }

    console.log("🔒 USER REGISTER - Hashing password");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user without sending verification email
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    console.log(
      "✅ USER REGISTER - User created successfully (no verification email sent)"
    );
    return res.status(201).json({
      message: "User registered successfully.",
      success: true,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone || "",
        isVerified: newUser.isVerified || false,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        profile: newUser.profile || {},
      },
    });
    // VERIFY EMAIL ENDPOINT
  } catch (error) {
    console.error("💥 USER REGISTER - Error occurred:", error);
    return res.status(500).json({
      message: "Internal server error during registration",
      error: error.message,
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    console.log("🔄 USER LOGIN - Starting login process");
    console.log("📧 Login attempt for email:", req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ USER LOGIN - Missing email or password");
      return res.status(400).json({
        message: "All fields are required (email, password)",
        success: false,
      });
    }

    console.log("🔍 USER LOGIN - Finding user in database");
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("❌ USER LOGIN - User not found");
      return res.status(400).json({
        message: "Invalid credentials (email)",
        success: false,
      });
    }

    console.log("✅ USER LOGIN - User found:", user.email);
    console.log("🔒 USER LOGIN - Verifying password");

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.log("❌ USER LOGIN - Password mismatch");
      return res.status(400).json({
        message: "Invalid credentials (password)",
        success: false,
      });
    }

    console.log("✅ USER LOGIN - Password verified successfully");
    console.log("🔑 USER LOGIN - Generating JWT token");

    const tokenData = { userId: user._id };
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    console.log("✅ USER LOGIN - Token generated successfully");

    // Prepare complete user data
    const completeUserData = {
      _id: user._id,
      username: user.username,
      name: user.name || user.username, // Fallback to username if name doesn't exist
      email: user.email,
      phone: user.phone || "",
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: {
        bio: user.profile?.bio || "",
        gender: user.profile?.gender || "",
        dob: user.profile?.dob || null,
        profilePicture: user.profile?.profilePicture || "",
        country: user.profile?.country || "",
        language: user.profile?.language || "en",
        ...user.profile,
      },
    };

    console.log(
      "👤 USER LOGIN - Complete user data prepared:",
      completeUserData
    );
    console.log("🍪 USER LOGIN - Setting cookie and sending response");

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        message: `Login successful. Welcome back, ${user.username}!`,
        success: true,
        user: completeUserData,
        token,
      });
  } catch (error) {
    console.error("💥 USER LOGIN - Error occurred:", error);
    return res.status(500).json({
      message: "Internal server error during login",
      error: error.message,
    });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    console.log("🔄 USER LOGOUT - Starting logout process");

    res
      .clearCookie("token", {
        httpOnly: true,
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({
        message: "Logout successful",
        success: true,
      });

    console.log("✅ USER LOGOUT - Logout successful");
  } catch (error) {
    console.error("💥 USER LOGOUT - Error occurred:", error);
    return res.status(500).json({
      message: "Internal server error during logout",
      error: error.message,
    });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    console.log("🔄 PROFILE UPDATE - Starting profile update process");
    console.log("👤 User ID:", req.id);
    console.log("📋 Update data received:", req.body);

    const {
      username,
      name,
      email,
      phone,
      bio,
      gender,
      dob,
      country,
      language,
      profilePicture,
    } = req.body;
    const file = req.file; // profile picture (legacy support)
    const userId = req.id; // from middleware

    console.log("🔍 PROFILE UPDATE - Finding user in database");
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ PROFILE UPDATE - User not found");
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    console.log("✅ PROFILE UPDATE - User found:", user.email);
    console.log("📊 Current user data:", user);

    // Update basic fields
    if (username) {
      console.log(
        "📝 PROFILE UPDATE - Updating username from",
        user.username,
        "to",
        username
      );
      user.username = username;
    }

    if (name) {
      console.log(
        "📝 PROFILE UPDATE - Updating name from",
        user.name,
        "to",
        name
      );
      user.name = name;
    }

    if (phone) {
      console.log(
        "📞 PROFILE UPDATE - Updating phone from",
        user.phone,
        "to",
        phone
      );
      user.phone = phone;
    }

    // Handle email update with duplicate check
    if (email && email !== user.email) {
      console.log(
        "📧 PROFILE UPDATE - Checking email availability for:",
        email
      );
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== user._id.toString()) {
        console.log("❌ PROFILE UPDATE - Email already in use");
        return res.status(400).json({
          message: "Email is already in use by another account",
          success: false,
        });
      }
      console.log(
        "📧 PROFILE UPDATE - Updating email from",
        user.email,
        "to",
        email
      );
      user.email = email;
    }

    // Ensure profile object exists
    if (!user.profile) {
      console.log("🆕 PROFILE UPDATE - Creating new profile object");
      user.profile = {};
    }

    // Update profile subfields
    if (bio !== undefined) {
      console.log("📝 PROFILE UPDATE - Updating bio");
      user.profile.bio = bio;
    }
    if (gender !== undefined) {
      console.log("👤 PROFILE UPDATE - Updating gender");
      user.profile.gender = gender;
    }
    if (country !== undefined) {
      console.log("🌍 PROFILE UPDATE - Updating country");
      user.profile.country = country;
    }
    if (language !== undefined) {
      console.log("🗣️ PROFILE UPDATE - Updating language");
      user.profile.language = language;
    }

    if (dob) {
      console.log("📅 PROFILE UPDATE - Updating date of birth");
      const parsedDob = new Date(dob);
      if (isNaN(parsedDob)) {
        console.log("❌ PROFILE UPDATE - Invalid DOB format");
        return res.status(400).json({ message: "Invalid DOB format" });
      }
      user.profile.dob = parsedDob;
    }

    // Handle profile picture - prioritize direct URL over file upload
    if (profilePicture) {
      console.log("🖼️ PROFILE UPDATE - Updating profile picture URL");
      user.profile.profilePicture = profilePicture;
    } else if (file) {
      console.log(
        "📁 PROFILE UPDATE - Updating profile picture from file upload"
      );
      user.profile.profilePicture = file.path;
    }

    console.log("💾 PROFILE UPDATE - Saving updated user to database");
    await user.save();

    console.log("✅ PROFILE UPDATE - User saved successfully");

    // Prepare complete updated user data
    const updatedUserData = {
      _id: user._id,
      username: user.username,
      name: user.name || user.username,
      email: user.email,
      phone: user.phone || "",
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: {
        bio: user.profile.bio || "",
        gender: user.profile.gender || "",
        dob: user.profile.dob || null,
        profilePicture: user.profile.profilePicture || "",
        country: user.profile.country || "",
        language: user.profile.language || "en",
        ...user.profile,
      },
    };

    console.log(
      "👤 PROFILE UPDATE - Complete updated user data:",
      updatedUserData
    );
    console.log("📤 PROFILE UPDATE - Sending response to client");

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: updatedUserData,
    });
  } catch (error) {
    console.error("💥 PROFILE UPDATE - Error occurred:", error);
    return res.status(500).json({
      message: "Internal server error during profile update",
      success: false,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    console.log("🔄 GET PROFILE - Starting profile fetch");
    console.log("👤 User ID:", req.id);

    const user = await User.findById(req.id);
    if (!user) {
      console.log("❌ GET PROFILE - User not found");
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    console.log("✅ GET PROFILE - User found:", user.email);

    // Prepare complete user data
    const completeUserData = {
      _id: user._id,
      username: user.username,
      name: user.name || user.username,
      email: user.email,
      phone: user.phone || "",
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: {
        bio: user.profile?.bio || "",
        gender: user.profile?.gender || "",
        dob: user.profile?.dob || null,
        profilePicture: user.profile?.profilePicture || "",
        country: user.profile?.country || "",
        language: user.profile?.language || "en",
        ...user.profile,
      },
    };

    console.log(
      "👤 GET PROFILE - Complete user data prepared:",
      completeUserData
    );

    return res.status(200).json({
      success: true,
      user: completeUserData,
    });
  } catch (err) {
    console.error("💥 GET PROFILE - Error occurred:", err);
    return res.status(500).json({
      message: "Error fetching user profile",
      error: err.message,
      success: false,
    });
  }
};

// REFRESH TOKEN
export const refreshToken = async (req, res) => {
  try {
    console.log("🔄 REFRESH TOKEN - Starting token refresh");
    console.log("👤 User ID:", req.id);

    const userId = req.id; // from middleware (if token is still valid)

    // Find user to generate new token
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ REFRESH TOKEN - User not found");
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    console.log("✅ REFRESH TOKEN - User found:", user.email);
    console.log("🔑 REFRESH TOKEN - Generating new token");

    // Generate new token
    const tokenData = { userId: user._id };
    const newToken = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    console.log("✅ REFRESH TOKEN - New token generated");

    // Prepare complete user data
    const completeUserData = {
      _id: user._id,
      username: user.username,
      name: user.name || user.username,
      email: user.email,
      phone: user.phone || "",
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: {
        bio: user.profile?.bio || "",
        gender: user.profile?.gender || "",
        dob: user.profile?.dob || null,
        profilePicture: user.profile?.profilePicture || "",
        country: user.profile?.country || "",
        language: user.profile?.language || "en",
        ...user.profile,
      },
    };

    console.log(
      "👤 REFRESH TOKEN - Complete user data prepared:",
      completeUserData
    );

    return res
      .status(200)
      .cookie("token", newToken, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        message: "Token refreshed successfully",
        success: true,
        token: newToken,
        user: completeUserData,
      });
  } catch (error) {
    console.error("💥 REFRESH TOKEN - Error occurred:", error);
    return res.status(500).json({
      message: "Internal server error during token refresh",
      error: error.message,
    });
  }
};

// Get user reading statistics
export const getUserStatistics = async (req, res) => {
  try {
    const userId = req.id;

    console.log("📊 USER STATS - Getting statistics for user:", userId);

    // Import models here to avoid circular dependencies
    const { article: Article } = await import("../models/article.model.js");
    const { comment: Comment } = await import("../models/comment.model.js");

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // MIGRATION: Handle old 'history' field and convert to 'readingHistory'
    if (
      user.history &&
      user.history.length > 0 &&
      (!user.readingHistory || user.readingHistory.length === 0)
    ) {
      console.log(
        "🔄 MIGRATION - Converting old history field to readingHistory for stats"
      );
      user.readingHistory = user.history.map((item) => ({
        articleId: item.article,
        readAt: item.viewedAt || new Date(),
        readCount: 1,
      }));
      user.history = []; // Clear old field
      await user.save();
      console.log(
        "✅ MIGRATION - Converted",
        user.readingHistory.length,
        "history items for stats"
      );
    }

    // Get bookmarked articles count
    const bookmarkedCount = user.bookmarks ? user.bookmarks.length : 0;

    // Get liked articles count (fix: use likedArticles instead of likes)
    const likedCount = user.likedArticles ? user.likedArticles.length : 0;

    // Get user's comments count
    const commentDocs = await Comment.find({});
    let userCommentsCount = 0;

    commentDocs.forEach((doc) => {
      if (doc.comments) {
        const userComments = doc.comments.filter(
          (comment) => String(comment.user) === String(userId)
        );
        userCommentsCount += userComments.length;
      }
    });
    // Get reading history count (also check user.history field)
    const readingHistoryCount =
      (user.readingHistory ? user.readingHistory.length : 0) +
      (user.history ? user.history.length : 0);

    // Get reading streak (simplified - days since last activity)
    const lastActivity = user.lastActivity || user.updatedAt || user.createdAt;
    const daysSinceLastActivity = Math.floor(
      (Date.now() - new Date(lastActivity)) / (1000 * 60 * 60 * 24)
    );
    const currentStreak = Math.max(0, 7 - daysSinceLastActivity); // Simple streak calculation
    const longestStreak = Math.max(currentStreak, 0); // Could be enhanced with stored data

    // Calculate engagement score
    const engagementScore =
      bookmarkedCount * 2 + likedCount * 1 + userCommentsCount * 3;

    // Calculate total reading time (estimate 5 minutes per article)
    const totalReadingTime = readingHistoryCount * 5;

    const stats = {
      articlesRead: readingHistoryCount,
      totalReadingTime: totalReadingTime,
      bookmarksCount: bookmarkedCount,
      likesCount: likedCount,
      commentsCount: userCommentsCount,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      engagementScore: engagementScore,
    };

    console.log("✅ USER STATS - Statistics calculated:", stats);

    res.json({
      success: true,
      stats: stats,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        joinDate: user.createdAt,
        lastActivity: lastActivity,
      },
    });
  } catch (error) {
    console.error("❌ USER STATS - Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user reading history
export const getReadingHistory = async (req, res) => {
  try {
    const userId = req.id;
    const { page = 1, limit = 20 } = req.query;

    console.log("📚 READING HISTORY - Getting history for user:", userId);

    const { article: Article } = await import("../models/article.model.js");

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // MIGRATION: Handle old 'history' field and convert to 'readingHistory'
    if (
      user.history &&
      user.history.length > 0 &&
      (!user.readingHistory || user.readingHistory.length === 0)
    ) {
      console.log(
        "🔄 MIGRATION - Converting old history field to readingHistory"
      );
      user.readingHistory = user.history.map((item) => ({
        articleId: item.article,
        readAt: item.viewedAt || new Date(),
        readCount: 1,
      }));
      user.history = []; // Clear old field
      await user.save();
      console.log(
        "✅ MIGRATION - Converted",
        user.readingHistory.length,
        "history items"
      );
    }

    if (!user.readingHistory || user.readingHistory.length === 0) {
      console.log("📚 READING HISTORY - No reading history found");
      return res.json({
        history: [],
        totalCount: 0,
        page: parseInt(page),
        totalPages: 0,
      });
    }

    // Get total count
    const totalCount = user.readingHistory.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated reading history (most recent first)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);

    const paginatedHistory = user.readingHistory
      .sort((a, b) => new Date(b.readAt) - new Date(a.readAt))
      .slice(startIndex, endIndex);

    // Get article details for the paginated history
    const articleIds = paginatedHistory.map((entry) => entry.articleId);
    const articles = await Article.find({ _id: { $in: articleIds } });

    // Combine reading history with article details
    const enrichedHistory = paginatedHistory.map((entry) => {
      const article = articles.find(
        (a) => String(a._id) === String(entry.articleId)
      );
      return {
        ...entry.toObject(),
        article: article || {
          title: "Article not found",
          description: "This article may have been removed",
        },
      };
    });

    console.log(
      `✅ READING HISTORY - Retrieved ${enrichedHistory.length} items`
    );

    res.json({
      history: enrichedHistory,
      totalCount,
      page: parseInt(page),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error("❌ READING HISTORY - Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add article to reading history
export const addToReadingHistory = async (req, res) => {
  try {
    const userId = req.id;
    const { articleId } = req.params;

    console.log("📖 ADD TO HISTORY - User:", userId, "Article:", articleId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize reading history if it doesn't exist
    if (!user.readingHistory) {
      user.readingHistory = [];
    }

    // Check if article is already in history
    const existingEntryIndex = user.readingHistory.findIndex(
      (entry) => String(entry.articleId) === String(articleId)
    );

    if (existingEntryIndex !== -1) {
      // Update existing entry
      user.readingHistory[existingEntryIndex].readAt = new Date();
      user.readingHistory[existingEntryIndex].readCount =
        (user.readingHistory[existingEntryIndex].readCount || 1) + 1;
    } else {
      // Add new entry
      user.readingHistory.push({
        articleId: articleId,
        readAt: new Date(),
        readCount: 1,
      });
    }

    // Update last activity
    user.lastActivity = new Date();

    await user.save();

    console.log("✅ ADD TO HISTORY - Successfully added/updated");
    res.json({ message: "Added to reading history" });
  } catch (error) {
    console.error("❌ ADD TO HISTORY - Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user badges
export const getUserBadges = async (req, res) => {
  try {
    const userId = req.id;

    console.log("🏆 USER BADGES - Getting badges for user:", userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user statistics first
    const { article: Article } = await import("../models/article.model.js");
    const { comment: Comment } = await import("../models/comment.model.js");

    const bookmarkedCount = user.bookmarks ? user.bookmarks.length : 0;
    const likedCount = user.likedArticles ? user.likedArticles.length : 0;
    const readingHistoryCount = user.readingHistory
      ? user.readingHistory.length
      : 0;

    // Get user's comments count
    const commentDocs = await Comment.find({});
    let userCommentsCount = 0;

    commentDocs.forEach((doc) => {
      if (doc.comments) {
        const userComments = doc.comments.filter(
          (comment) => String(comment.user) === String(userId)
        );
        userCommentsCount += userComments.length;
      }
    });

    // Calculate badges based on user activity
    const badges = [];

    // Reading badges
    if (readingHistoryCount >= 100) {
      badges.push({
        id: "avid_reader",
        name: "Avid Reader",
        description: "Read 100+ articles",
        icon: "📚",
        earned: true,
      });
    } else if (readingHistoryCount >= 50) {
      badges.push({
        id: "bookworm",
        name: "Bookworm",
        description: "Read 50+ articles",
        icon: "🐛",
        earned: true,
      });
    } else if (readingHistoryCount >= 10) {
      badges.push({
        id: "curious_reader",
        name: "Curious Reader",
        description: "Read 10+ articles",
        icon: "🤔",
        earned: true,
      });
    }

    // Engagement badges
    if (userCommentsCount >= 50) {
      badges.push({
        id: "discussion_leader",
        name: "Discussion Leader",
        description: "Posted 50+ comments",
        icon: "💬",
        earned: true,
      });
    } else if (userCommentsCount >= 20) {
      badges.push({
        id: "active_commenter",
        name: "Active Commenter",
        description: "Posted 20+ comments",
        icon: "🗨️",
        earned: true,
      });
    } else if (userCommentsCount >= 5) {
      badges.push({
        id: "conversation_starter",
        name: "Conversation Starter",
        description: "Posted 5+ comments",
        icon: "💭",
        earned: true,
      });
    }

    // Curator badges
    if (bookmarkedCount >= 50) {
      badges.push({
        id: "master_curator",
        name: "Master Curator",
        description: "Bookmarked 50+ articles",
        icon: "🎯",
        earned: true,
      });
    } else if (bookmarkedCount >= 20) {
      badges.push({
        id: "curator",
        name: "Curator",
        description: "Bookmarked 20+ articles",
        icon: "📌",
        earned: true,
      });
    }

    // Supporter badges
    if (likedCount >= 100) {
      badges.push({
        id: "super_supporter",
        name: "Super Supporter",
        description: "Liked 100+ articles",
        icon: "⭐",
        earned: true,
      });
    } else if (likedCount >= 50) {
      badges.push({
        id: "supporter",
        name: "Supporter",
        description: "Liked 50+ articles",
        icon: "👍",
        earned: true,
      });
    }

    // Time-based badges
    const accountAge = Math.floor(
      (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
    );
    if (accountAge >= 365) {
      badges.push({
        id: "veteran",
        name: "Veteran",
        description: "Member for 1+ year",
        icon: "🎖️",
        earned: true,
      });
    } else if (accountAge >= 30) {
      badges.push({
        id: "regular",
        name: "Regular",
        description: "Member for 30+ days",
        icon: "🏅",
        earned: true,
      });
    }

    console.log(`✅ USER BADGES - Found ${badges.length} earned badges`);

    res.json({ badges, totalBadges: badges.length });
  } catch (error) {
    console.error("❌ USER BADGES - Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
        success: false,
      });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    return res
      .status(200)
      .json({ message: "Email verified successfully!", success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error verifying email", error: error.message });
  }
};

// SEND CODE TO EMAIL ENDPOINT
export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required", success: false });
    }
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Optionally, save code to user document for later verification
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    user.verificationCode = code;
    await user.save();
    // Send code to email
    const { sendCodeEmail } = await import("../utils/sendCodeEmail.js");
    await sendCodeEmail(email, code);
    return res
      .status(200)
      .json({ message: "Verification code sent to email", success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error sending code", error: error.message });
  }
};
