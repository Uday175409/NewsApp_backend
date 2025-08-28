import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    // `link` replaces `url`, allows nulls and enforces uniqueness when present
    link: {
      type: String,
      unique: true,
      sparse: true,   // allows multiple nulls
      default: null,
    },

    image_url: String,
    publishedAt: Date,
    author: String,

    source_name: String,
    source_url: String,
    source_icon: String,

    category: String,
    country: String,

    // User interactions
    savedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      bookmarkedAt: { type: Date, default: Date.now }
    }],
    likedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      likedAt: { type: Date, default: Date.now }
    }],
    viewedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],

    // Add user interaction history arrays for detailed sorting in analytics
    viewHistory: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      viewedAt: { type: Date, default: Date.now }
    }],

    likesHistory: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      likedAt: { type: Date, default: Date.now }
    }],

    savedHistory: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      savedAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

export const article = mongoose.models.Article || mongoose.model('Article', articleSchema);
