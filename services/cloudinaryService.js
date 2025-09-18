import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

class CloudinaryService {
  /**
   * Upload image to Cloudinary from buffer (memory)
   * @param {Buffer} buffer - Image buffer from multer memory storage
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  static async uploadImageFromBuffer(buffer, options = {}) {
    try {
      const {
        folder = 'news-app',
        transformation = {},
        resourceType = 'image',
        quality = 'auto',
        fetchFormat = 'auto'
      } = options;

      const uploadOptions = {
        folder,
        resource_type: resourceType,
        quality,
        fetch_format: fetchFormat,
        ...transformation
      };

      // Upload buffer directly to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(buffer);
      });

      return {
        success: true,
        data: {
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          created_at: result.created_at
        }
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Upload image to Cloudinary (legacy method for file paths)
   * @param {string} filePath - Local file path
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  static async uploadImage(filePath, options = {}) {
    try {
      const {
        folder = 'news-app',
        transformation = {},
        resourceType = 'image',
        quality = 'auto',
        fetchFormat = 'auto'
      } = options;

      const uploadOptions = {
        folder,
        resource_type: resourceType,
        quality,
        fetch_format: fetchFormat,
        ...transformation
      };

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);
      
      // Delete local file after upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        success: true,
        data: {
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          created_at: result.created_at
        }
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      
      // Clean up local file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple images from buffers
   * @param {Array} files - Array of file objects with buffers
   * @param {Object} options - Upload options
   * @returns {Promise<Array>} Array of upload results
   */
  static async uploadMultipleImagesFromBuffers(files, options = {}) {
    try {
      const uploadPromises = files.map(file => 
        this.uploadImageFromBuffer(file.buffer, options)
      );
      
      const results = await Promise.allSettled(uploadPromises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Upload failed for file ${files[index].originalname}:`, result.reason);
          return {
            success: false,
            error: result.reason.message,
            fileName: files[index].originalname
          };
        }
      });
    } catch (error) {
      throw new Error(`Multiple image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple images (legacy method for file paths)
   * @param {Array} filePaths - Array of local file paths
   * @param {Object} options - Upload options
   * @returns {Promise<Array>} Array of upload results
   */
  static async uploadMultipleImages(filePaths, options = {}) {
    try {
      const uploadPromises = filePaths.map(filePath => 
        this.uploadImage(filePath, options)
      );
      
      const results = await Promise.allSettled(uploadPromises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Upload failed for file ${filePaths[index]}:`, result.reason);
          return {
            success: false,
            error: result.reason.message,
            filePath: filePaths[index]
          };
        }
      });
    } catch (error) {
      throw new Error(`Multiple image upload failed: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      return {
        success: result.result === 'ok',
        data: result
      };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple images
   * @param {Array} publicIds - Array of Cloudinary public IDs
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteMultipleImages(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Cloudinary bulk delete error:', error);
      throw new Error(`Bulk image deletion failed: ${error.message}`);
    }
  }

  /**
   * Get optimized image URL
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} transformations - Transformation options
   * @returns {string} Optimized image URL
   */
  static getOptimizedUrl(publicId, transformations = {}) {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
      gravity = 'center'
    } = transformations;

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format,
      gravity
    });
  }

  /**
   * Generate transformation URLs for different sizes
   * @param {string} publicId - Cloudinary public ID
   * @returns {Object} Object with different sized URLs
   */
  static generateResponsiveUrls(publicId) {
    return {
      thumbnail: this.getOptimizedUrl(publicId, { width: 150, height: 150 }),
      small: this.getOptimizedUrl(publicId, { width: 300, height: 200 }),
      medium: this.getOptimizedUrl(publicId, { width: 600, height: 400 }),
      large: this.getOptimizedUrl(publicId, { width: 1200, height: 800 }),
      original: cloudinary.url(publicId, { quality: 'auto', fetch_format: 'auto' })
    };
  }

  /**
   * Validate image file
   * @param {Object} file - Multer file object
   * @returns {Object} Validation result
   */
  static validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 10MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Get image details from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Image details
   */
  static async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      
      return {
        success: true,
        data: {
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          created_at: result.created_at,
          url: result.secure_url
        }
      };
    } catch (error) {
      console.error('Error fetching image details:', error);
      throw new Error(`Failed to get image details: ${error.message}`);
    }
  }
}

export default CloudinaryService;
