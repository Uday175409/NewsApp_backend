import multer from "multer";

// Use memory storage for direct Cloudinary upload
const storage = multer.memoryStorage();

// File type filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  
  console.log('File details:', {
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: jpeg, jpg, png, gif, webp`), false);
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
