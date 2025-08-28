import express from "express";
import connectDB from "./utils/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/user.route.js";
import articleRoutes from "./routes/article.route.js";
import fetchRouter from "./routes/fetch.route.js";
import commentRoutes from "./routes/comment.route.js";
import imageRoutes from "./routes/image.route.js";
import adminRoutes from "./routes/admin.route.js";

dotenv.config();

const port = 4000;
const app = express();

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve uploads folder statically with proper MIME types
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, path) => {
    const ext = path.split('.').pop().toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case 'png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case 'gif':
        res.setHeader('Content-Type', 'image/gif');
        break;
      case 'webp':
        res.setHeader('Content-Type', 'image/webp');
        break;
      default:
        res.setHeader('Content-Type', 'image/jpeg');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Welcome to the server",
    timeStemp: new Date().toISOString(),
    success: true,
  });
});

// API Routes
app.use("/api/user", routes);
app.use("/api/article", articleRoutes);
app.use("/api/news", fetchRouter);
app.use("/api/comments", commentRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/admin", adminRoutes);

// Connect to database immediately
connectDB();

// Export the app for Vercel
export default app;
