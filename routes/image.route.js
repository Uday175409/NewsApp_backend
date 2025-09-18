import express from 'express';
import ImageController from '../controllers/image.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import upload from '../middlewares/multerconfig.js';

const router = express.Router();

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
}, upload.any(), (req, res) => {
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
