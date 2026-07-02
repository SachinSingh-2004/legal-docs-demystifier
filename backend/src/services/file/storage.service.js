const fs = require('fs');
const path = require('path');

/**
  * Storage Service Abstraction Layer
  * Easily interchangeable with AWS S3, Google Cloud Storage, or Cloudinary.
  */
class StorageService {
  /**
   * Saves uploaded file to persistent storage.
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} File metadata containing path/URL
   */
  async uploadFile(file) {
    // Current implementation: Local Disk Storage
    // In production: Upload to S3 or Cloudinary and return remote URL.
    return {
      filePath: file.path,
      url: `/uploads/${path.basename(file.path)}`,
      fileName: file.originalname,
      fileSize: file.size
    };
  }

  /**
   * Deletes a file from storage.
   * @param {string} filePath - Absolute path or URL of the file to delete
   * @returns {Promise<boolean>}
   */
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Failed to delete storage file:', filePath, err.message);
      return false;
    }
  }
}

module.exports = new StorageService();
