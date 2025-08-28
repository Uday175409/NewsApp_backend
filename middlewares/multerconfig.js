import multer from "multer";
import path from "path";
import fs from "fs";

// Use /tmp directory for serverless environments (Vercel)
const uploadFolder = process.env.NODE_ENV === 'production' ? '/tmp/' : 'uploads/';
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    // Get the original extension
    let ext = path.extname(file.originalname).toLowerCase();
    
    // If no extension or invalid extension, default based on mimetype
    if (!ext || !['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      switch (file.mimetype) {
        case 'image/jpeg':
          ext = '.jpg';
          break;
        case 'image/png':
          ext = '.png';
          break;
        case 'image/gif':
          ext = '.gif';
          break;
        case 'image/webp':
          ext = '.webp';
          break;
        default:
          ext = '.jpg'; // fallback
      }
    }
    
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    console.log('Generated filename:', uniqueName);
    cb(null, uniqueName);
  },
});

// File type filter (optional)
const fileFilter = (req, file, cb) => {
  // Check both mimetype and original filename extension
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  console.log('File details:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extension: fileExtension
  });
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default upload;
