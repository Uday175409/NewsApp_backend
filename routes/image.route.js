import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ImageController from '../controllers/image.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp'); // Temporary local storage before Cloudinary upload
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  }
});

// Create a more flexible upload middleware that accepts any field name
const flexibleUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  }
});

// Routes

/**
 * @route POST /api/images/test-upload
 * @desc Test upload to debug field names
 * @access Private
 */
router.post('/test-upload', isAuthenticated, (req, res, next) => {
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.get('content-type'));
  next();
}, flexibleUpload.any(), (req, res) => {
  console.log('Files:', req.files);
  console.log('File:', req.file);
  console.log('Body:', req.body);
  res.json({
    success: true,
    files: req.files,
    file: req.file,
    body: req.body
  });
});

/**
 * @route POST /api/images/upload
 * @desc Upload single image
 * @access Private
 */
router.post('/upload', isAuthenticated, upload.single('image'), ImageController.uploadSingleImage);

/**
 * @route POST /api/images/upload-multiple
 * @desc Upload multiple images
 * @access Private
 */
router.post('/upload-multiple', isAuthenticated, upload.array('images', 5), ImageController.uploadMultipleImages);

/**
 * @route DELETE /api/images/:publicId
 * @desc Delete single image
 * @access Private
 */
router.delete('/:publicId', isAuthenticated, ImageController.deleteImage);

/**
 * @route DELETE /api/images/bulk-delete
 * @desc Delete multiple images
 * @access Private
 */
router.delete('/bulk-delete', isAuthenticated, ImageController.deleteMultipleImages);

/**
 * @route GET /api/images/:publicId/urls
 * @desc Get optimized image URLs
 * @access Public
 */
router.get('/:publicId/urls', ImageController.getOptimizedUrls);

/**
 * @route GET /api/images/:publicId/details
 * @desc Get image details
 * @access Public
 */
router.get('/:publicId/details', ImageController.getImageDetails);

export default router;
