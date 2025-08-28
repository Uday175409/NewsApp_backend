import { article as Article } from "../models/article.model.js";
import { user as User } from "../models/user.model.js";

// CREATE ARTICLE WITHOUT VIEWING
export const createArticleWithoutView = async (req, res) => {
  try {
    const {
      link,
      title,
      description,
      image_url,
      publishedAt,
      author,
      source_name,
      source_url,
      source_icon,
      category,
      country,
    } = req.body;

    const userId = req.id;

    if (!link) {
      return res.status(400).json({
        message: "Article link is required",
        success: false,
      });
    }

    const cleanAuthor = Array.isArray(author) ? author.join(", ") : author;
    const cleanCategory = Array.isArray(category)
      ? category.join(", ")
      : category;
    const cleanCountry = Array.isArray(country) ? country.join(", ") : country;

    let article = await Article.findOne({ link });

    if (!article) {
      article = await Article.create({
        link,
        title,
        description: description || null,
        image_url: image_url || null,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        author: cleanAuthor || null,
        source_name: source_name || null,
        source_url: source_url || null,
        source_icon: source_icon || null,
        category: cleanCategory || null,
        country: cleanCountry || null,
      });
    }

    res.status(200).json({
      message: "Article created successfully",
      success: true,
      articleId: article._id,
    });
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).json({
      message: "Internal server error while creating article",
      success: false,
    });
  }
};

// VIEW ARTICLE
export const markArticleAsViewed = async (req, res) => {
  try {
    const {
      link,
      title,
      description,
      image_url,
      publishedAt,
      author,
      source_name,
      source_url,
      source_icon,
      category,
      country,
    } = req.body;

    const userId = req.id;

    if (!link) {
      return res.status(400).json({
        message: "Article link is required",
        success: false,
      });
    }

    const cleanAuthor = Array.isArray(author) ? author.join(", ") : author;
    const cleanCategory = Array.isArray(category)
      ? category.join(", ")
      : category;
    const cleanCountry = Array.isArray(country) ? country.join(", ") : country;

    let article = await Article.findOne({ link });

    if (!article) {
      article = await Article.create({
        link,
        title,
        description: description || null,
        image_url: image_url || null,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        author: cleanAuthor || null,
        source_name: source_name || null,
        source_url: source_url || null,
        source_icon: source_icon || null,
        category: cleanCategory || null,
        country: cleanCountry || null,
        viewedBy: [{ user: userId }],
      });
    } else {
      const alreadyViewed = article.viewedBy.some((v) => v.user.equals(userId));
      if (!alreadyViewed) {
        article.viewedBy.push({ user: userId });
        article.lastViewed = new Date();
        await article.save();
      }
    }
    console.log("Article came to markArticleAsViewed: ", {
      link,
      title,
      description: description || null,
      image_url: image_url || null,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      author: cleanAuthor || null,
      source_name: source_name || null,
      source_url: source_url || null,
      source_icon: source_icon || null,
      category: cleanCategory || null,
      country: cleanCountry || null,
      viewedBy: [{ user: userId }],
    });
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const alreadyInHistory = user.history.some(
      (entry) => entry.article.toString() === article._id.toString()
    );

    if (!alreadyInHistory) {
      user.history.push({ article: article._id, viewedAt: new Date() });
      await user.save();
    }

    res.status(200).json({
      message: "Article marked as viewed",
      success: true,
      articleId: article._id,
    });
  } catch (error) {
    console.error("Error viewing article:", error);
    res.status(500).json({
      message: "Internal server error while viewing article",
      success: false,
    });
  }
};

// LIKE / UNLIKE
export const likeArticle = async (req, res) => {
  try {
    const { articleId } = req.body;
    const userId = req.id;

    const article = await Article.findById(articleId);
    const user = await User.findById(userId);

    if (!article || !user) {
      return res
        .status(404)
        .json({ message: "User or Article not found", success: false });
    }

    const alreadyLiked = article.likedBy.includes(userId);

    if (alreadyLiked) {
      article.likedBy.pull(userId);
      user.likedArticles.pull(articleId);
    } else {
      article.likedBy.push(userId);
      user.likedArticles.push(articleId);
      article.lastLiked = new Date();
    }

    await article.save();
    await user.save();

    res.status(200).json({
      message: alreadyLiked ? "Article unliked" : "Article liked",
      success: true,
    });
  } catch (error) {
    console.error("Error liking/unliking article:", error);
    res.status(500).json({
      message: "Internal server error while liking/unliking",
      success: false,
    });
  }
};

// BOOKMARK / UNBOOKMARK
export const bookmarkArticle = async (req, res) => {
  try {
    const { articleId } = req.body;
    const userId = req.id;
    console.log("bookmark called"+{articleId, userId});
    
    const article = await Article.findById(articleId);
    const user = await User.findById(userId);

    if (!article || !user) {
      return res
        .status(404)
        .json({ message: "User or Article not found", success: false });
    }

    const alreadyBookmarked = article.savedBy.includes(userId);

    if (alreadyBookmarked) {
      article.savedBy.pull(userId);
      user.bookmarks.pull(articleId);
    } else {
      article.savedBy.push(userId);
      user.bookmarks.push(articleId);
      article.lastSaved = new Date();
    }

    await article.save();
    await user.save();

    res.status(200).json({
      message: alreadyBookmarked
        ? "Article unbookmarked"
        : "Article bookmarked",
      success: true,
    });
  } catch (error) {
    console.error("Error bookmarking/unbookmarking article:", error);
    res.status(500).json({
      message: "Internal server error while bookmarking/unbookmarking",
      success: false,
    });
  }
};

// GET LIKES
export const getLikes = async (req, res) => {
  try {
    const user = await User.findById(req.id).populate("likedArticles");
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    res.status(200).json({
      success: true,
      articles: user.likedArticles,
      message: "Liked articles fetched successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching liked articles", success: false });
  }
};

// GET BOOKMARKS
export const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.id).populate("bookmarks");
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    res.status(200).json({
      success: true,
      articles: user.bookmarks,
      message: "Bookmarked articles fetched successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching bookmarked articles", success: false });
  }
};

// GET HISTORY
export const getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.id).populate("history.article");

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Filter out null or unpopulated articles
    const articles = user.history
      .filter((entry) => entry.article && entry.article._doc)
      .map((entry) => ({
        ...entry.article._doc,
        viewedAt: entry.viewedAt,
      }));

    res.status(200).json({
      success: true,
      articles,
      message: "History fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Error fetching history", success: false });
  }
};

// GET FEATURED ARTICLES BASED ON ENGAGEMENT
export const getFeaturedArticles = async (req, res) => {
  try {
    // Get articles sorted by engagement score (views + bookmarks + likes)
    const featuredArticles = await Article.aggregate([
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $size: { $ifNull: ["$views", []] } },
              { $size: { $ifNull: ["$bookmarkedBy", []] } },
              { $size: { $ifNull: ["$likedBy", []] } }
            ]
          }
        }
      },
      {
        $match: {
          engagementScore: { $gt: 0 } // Only articles with some engagement
        }
      },
      {
        $sort: { engagementScore: -1, createdAt: -1 }
      },
      {
        $limit: 6
      },
      {
        $project: {
          link: 1,
          title: 1,
          description: 1,
          image_url: 1,
          publishedAt: 1,
          author: 1,
          source_name: 1,
          source_url: 1,
          source_icon: 1,
          category: 1,
          country: 1,
          createdAt: 1,
          engagementScore: 1,
          viewsCount: { $size: { $ifNull: ["$views", []] } },
          bookmarksCount: { $size: { $ifNull: ["$bookmarkedBy", []] } },
          likesCount: { $size: { $ifNull: ["$likedBy", []] } }
        }
      }
    ]);

    // If we don't have enough engaged articles, fill with recent articles
    if (featuredArticles.length < 6) {
      const recentArticles = await Article.find({
        _id: { $nin: featuredArticles.map(a => a._id) }
      })
      .sort({ createdAt: -1 })
      .limit(6 - featuredArticles.length)
      .select('link title description image_url publishedAt author source_name source_url source_icon category country createdAt');

      featuredArticles.push(...recentArticles.map(article => ({
        ...article.toObject(),
        engagementScore: 0,
        viewsCount: 0,
        bookmarksCount: 0,
        likesCount: 0
      })));
    }

    res.status(200).json({
      message: "Featured articles fetched successfully",
      success: true,
      articles: featuredArticles,
    });
  } catch (error) {
    console.error("Error fetching featured articles:", error);
    res.status(500).json({ 
      message: "Error fetching featured articles", 
      success: false 
    });
  }
};

export const addComment = async (req, res) => {
try {
  
} catch (error) {
  
}
}
