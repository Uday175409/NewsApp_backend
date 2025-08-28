import CloudinaryService from "../services/cloudinaryService.js";

class ImageController {
  /**
   * Upload single image
   */
  static async uploadSingleImage(req, res) {
    try {
      console.log("🔄 IMAGE UPLOAD - Starting single image upload process");
      console.log("📁 Request file info:", {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
      });
      console.log("📋 Request body:", req.body);

      // For single file upload, use req.file
      if (!req.file) {
        console.log("❌ IMAGE UPLOAD - No file uploaded in request");
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      console.log("✅ IMAGE UPLOAD - File received, starting validation");

      // Validate image
      const validation = CloudinaryService.validateImage(req.file);
      if (!validation.valid) {
        console.log("❌ IMAGE UPLOAD - Validation failed:", validation.error);
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      console.log("✅ IMAGE UPLOAD - File validation passed");

      // Upload to Cloudinary
      const uploadOptions = {
        folder: req.body.folder || "news-app",
        transformation: {},
      };

      console.log("🔄 IMAGE UPLOAD - Preparing upload options:", uploadOptions);

      // Add transformations if specified
      if (req.body.width) {
        uploadOptions.transformation.width = parseInt(req.body.width);
        console.log(
          "📐 IMAGE UPLOAD - Width transformation added:",
          req.body.width
        );
      }
      if (req.body.height) {
        uploadOptions.transformation.height = parseInt(req.body.height);
        console.log(
          "📐 IMAGE UPLOAD - Height transformation added:",
          req.body.height
        );
      }
      if (req.body.crop) {
        uploadOptions.transformation.crop = req.body.crop;
        console.log(
          "✂️ IMAGE UPLOAD - Crop transformation added:",
          req.body.crop
        );
      }

      console.log("☁️ IMAGE UPLOAD - Starting Cloudinary upload...");
      console.log("📂 File path being uploaded:", req.file.path);

      const result = await CloudinaryService.uploadImage(
        req.file.path,
        uploadOptions
      );

      console.log("✅ IMAGE UPLOAD - Cloudinary upload successful");
      console.log("📊 Upload result:", {
        success: result.success,
        publicId: result.data?.public_id,
        url: result.data?.secure_url,
        format: result.data?.format,
        size: result.data?.bytes,
      });

      res.json({
        success: true,
        message: "Image uploaded successfully",
        data: result.data,
      });

      console.log("🎉 IMAGE UPLOAD - Response sent to client successfully");
    } catch (error) {
      console.error("💥 IMAGE UPLOAD - Error occurred:", error);
      console.error("📋 Error details:", {
        message: error.message,
        stack: error.stack,
        fileName: req.file?.originalname,
      });

      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload image",
      });
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(req, res) {
    try {
      console.log(
        "🔄 MULTIPLE UPLOAD - Starting multiple images upload process"
      );
      console.log("📁 Request files info:", {
        hasFiles: !!req.files,
        fileCount: req.files?.length,
        fileNames: req.files?.map((f) => f.originalname),
      });

      // For multiple file upload, use req.files
      if (!req.files || req.files.length === 0) {
        console.log("❌ MULTIPLE UPLOAD - No files uploaded in request");
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      console.log(
        "✅ MULTIPLE UPLOAD - Files received, starting validation for all files"
      );

      // Validate all images
      for (const file of req.files) {
        console.log(
          `🔍 MULTIPLE UPLOAD - Validating file: ${file.originalname}`
        );
        const validation = CloudinaryService.validateImage(file);
        if (!validation.valid) {
          console.log(
            `❌ MULTIPLE UPLOAD - Validation failed for ${file.originalname}:`,
            validation.error
          );
          return res.status(400).json({
            success: false,
            message: `${file.originalname}: ${validation.error}`,
          });
        }
      }

      console.log("✅ MULTIPLE UPLOAD - All files validation passed");

      // Upload to Cloudinary
      const uploadOptions = {
        folder: req.body.folder || "news-app",
        transformation: {},
      };

      console.log(
        "☁️ MULTIPLE UPLOAD - Starting batch upload to Cloudinary..."
      );

      const filePaths = req.files.map((file) => file.path);
      const results = await CloudinaryService.uploadMultipleImages(
        filePaths,
        uploadOptions
      );

      const successfulUploads = results.filter((result) => result.success);
      const failedUploads = results.filter((result) => !result.success);

      console.log("📊 MULTIPLE UPLOAD - Upload results:", {
        total: results.length,
        successful: successfulUploads.length,
        failed: failedUploads.length,
      });

      res.json({
        success: true,
        message: `${successfulUploads.length} images uploaded successfully`,
        data: {
          successful: successfulUploads.map((result) => result.data),
          failed: failedUploads,
          total: results.length,
          successCount: successfulUploads.length,
          failureCount: failedUploads.length,
        },
      });

      console.log("🎉 MULTIPLE UPLOAD - Response sent to client successfully");
    } catch (error) {
      console.error("💥 MULTIPLE UPLOAD - Error occurred:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload images",
      });
    }
  }

  /**
   * Delete image
   */
  static async deleteImage(req, res) {
    try {
      const { publicId } = req.params;

      console.log("🗑️ IMAGE DELETE - Starting image deletion process");
      console.log("🆔 Public ID to delete:", publicId);

      if (!publicId) {
        console.log("❌ IMAGE DELETE - No public ID provided");
        return res.status(400).json({
          success: false,
          message: "Public ID is required",
        });
      }

      console.log("☁️ IMAGE DELETE - Calling Cloudinary delete service...");
      const result = await CloudinaryService.deleteImage(publicId);

      if (result.success) {
        console.log(
          "✅ IMAGE DELETE - Image deleted successfully from Cloudinary"
        );
        res.json({
          success: true,
          message: "Image deleted successfully",
          data: result.data,
        });
      } else {
        console.log("❌ IMAGE DELETE - Failed to delete image from Cloudinary");
        res.status(400).json({
          success: false,
          message: "Failed to delete image",
        });
      }
    } catch (error) {
      console.error("💥 IMAGE DELETE - Error occurred:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete image",
      });
    }
  }

  /**
   * Delete multiple images
   */
  static async deleteMultipleImages(req, res) {
    try {
      const { publicIds } = req.body;

      console.log("🗑️ BULK DELETE - Starting multiple images deletion process");
      console.log("🆔 Public IDs to delete:", publicIds);

      if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
        console.log("❌ BULK DELETE - Invalid public IDs array provided");
        return res.status(400).json({
          success: false,
          message: "Public IDs array is required",
        });
      }

      console.log("☁️ BULK DELETE - Calling Cloudinary bulk delete service...");
      const result = await CloudinaryService.deleteMultipleImages(publicIds);

      console.log("✅ BULK DELETE - Bulk deletion completed");
      res.json({
        success: true,
        message: "Images deleted successfully",
        data: result.data,
      });
    } catch (error) {
      console.error("💥 BULK DELETE - Error occurred:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete images",
      });
    }
  }

  /**
   * Get optimized image URLs
   */
  static async getOptimizedUrls(req, res) {
    try {
      const { publicId } = req.params;
      const { width, height, crop, quality, format } = req.query;

      console.log("🔄 URL OPTIMIZATION - Starting URL generation process");
      console.log("🆔 Public ID:", publicId);
      console.log("⚙️ Transformation params:", {
        width,
        height,
        crop,
        quality,
        format,
      });

      if (!publicId) {
        console.log("❌ URL OPTIMIZATION - No public ID provided");
        return res.status(400).json({
          success: false,
          message: "Public ID is required",
        });
      }

      const transformations = {};
      if (width) transformations.width = parseInt(width);
      if (height) transformations.height = parseInt(height);
      if (crop) transformations.crop = crop;
      if (quality) transformations.quality = quality;
      if (format) transformations.format = format;

      console.log("🔄 URL OPTIMIZATION - Generating optimized URLs...");
      const optimizedUrl = CloudinaryService.getOptimizedUrl(
        publicId,
        transformations
      );
      const responsiveUrls = CloudinaryService.generateResponsiveUrls(publicId);

      console.log("✅ URL OPTIMIZATION - URLs generated successfully");
      res.json({
        success: true,
        data: {
          optimized: optimizedUrl,
          responsive: responsiveUrls,
        },
      });
    } catch (error) {
      console.error("💥 URL OPTIMIZATION - Error occurred:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate URLs",
      });
    }
  }

  /**
   * Get image details
   */
  static async getImageDetails(req, res) {
    try {
      const { publicId } = req.params;

      console.log("🔍 IMAGE DETAILS - Starting image details retrieval");
      console.log("🆔 Public ID:", publicId);

      if (!publicId) {
        console.log("❌ IMAGE DETAILS - No public ID provided");
        return res.status(400).json({
          success: false,
          message: "Public ID is required",
        });
      }

      console.log("☁️ IMAGE DETAILS - Fetching details from Cloudinary...");
      const result = await CloudinaryService.getImageDetails(publicId);

      console.log("✅ IMAGE DETAILS - Details retrieved successfully");
      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("💥 IMAGE DETAILS - Error occurred:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get image details",
      });
    }
  }
}

export default ImageController;
