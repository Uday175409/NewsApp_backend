// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, require: true },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    profile: {
      bio: { type: String, default: "" },
      profilePicture: { type: String, default: "" }, // Path or URL
      gender: { type: String, default: "" },
      dob: { type: Date },
      country: { type: String, default: "" },
      language: { type: String, default: "English" },
      phone: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
      },
    },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    likedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    readingHistory: [
      {
        articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
        readAt: { type: Date, default: Date.now },
        readCount: { type: Number, default: 1 },
      },
    ],
    // Legacy field for migration
    history: [
      {
        article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    lastActivity: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeGeneratedAt: { type: Date },
    verificationCodeExpiresAt: { type: Date },
  },
  { timestamps: true }
);
const user = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = { user };
