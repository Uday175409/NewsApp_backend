// const jwt=require("jsonwebtoken");
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const isAuthenticated = (req, res, next) => {
  try {
    // Check for token in cookies first, then in Authorization header
    let token = req.cookies.token;
    
    // If no token in cookies, check Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized access, token missing" });
    }
    
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (!decoded) {
      return res
        .status(401)
        .json({ message: "Unauthorized access, invalid token" });
    }
    req.id = decoded.userId;
    // req.user = user; // ✅ attach full user object
    // console.log("Decoded token:", decoded);
    // console.log("Assigned req.id:", req.id);
    next();
  } catch (error) {
    console.error("Error in isAuthenticated middleware:", error);
    
    // Handle JWT specific errors
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ 
          message: "Token expired, please login again",
          error: "TOKEN_EXPIRED" 
        });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res
        .status(401)
        .json({ 
          message: "Invalid token, please login again",
          error: "INVALID_TOKEN" 
        });
    }
    
    if (error.name === 'NotBeforeError') {
      return res
        .status(401)
        .json({ 
          message: "Token not active yet",
          error: "TOKEN_NOT_ACTIVE" 
        });
    }
    
    // Generic error for other cases
    return res
      .status(500)
      .json({ message: "Internal server error from middleware" });
  }
};

export default isAuthenticated;
