import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const isAdmin = (req, res, next) => {
  try {
    // Check for admin token in cookie first, then Authorization header
    const token = req.cookies.admin_token || req.headers.authorization?.split(' ')[1];
    
    console.log('Admin middleware - Token source:', req.cookies.admin_token ? 'Cookie' : 'Header');
    console.log('Admin middleware - Token:', token ? 'Present' : 'Missing');
    console.log('Admin middleware - Headers:', req.headers.authorization);
    console.log('Admin middleware - Cookies:', req.cookies);
    
    if (!token) {
      console.log('Admin middleware - No token provided');
      return res.status(401).json({
        message: "No admin token provided",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    console.log('Admin middleware - Decoded token:', decoded);
    
    // Check if the token is for admin
    if (decoded.role !== "admin" || decoded.email !== process.env.ADMIN_EMAIL) {
      console.log('Admin middleware - Invalid role or email:', {
        tokenRole: decoded.role,
        tokenEmail: decoded.email,
        expectedEmail: process.env.ADMIN_EMAIL
      });
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
        success: false,
      });
    }

    console.log('Admin middleware - Authentication successful');
    req.admin = decoded;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error.message);
    return res.status(401).json({
      message: "Invalid or expired admin token",
      success: false,
    });
  }
};

export default isAdmin;
