const moment = require('moment');
const multer = require("multer");
const express = require('express');

const { logger } = require("../logger/logger");
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ApplicationConstants = require('../contants/application-constants');


const phishingCampaignDirectoryPath = ApplicationConstants.QR_CODE_STORAGE_DIR
// Set up the storage configuration for saving files to the system
const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    // Set destination directory for file uploads
    cb(null, phishingCampaignDirectoryPath); // Ensure this directory exists or create it manually
  },
  filename: (req, file, cb) => {
    // Get the Unix timestamp and append it to the filename
    const unixTimestamp = Date.now();  // This will give the current Unix timestamp
    const extension = path.extname(file.originalname); // Get file extension
    const fileName = `${unixTimestamp}-${file.originalname}`;
    logger.info('CAMPAIGN MULTER MIDDLEWARE ::: FILENAME IS ' + fileName)
    cb(null, fileName); // Save the file with the Unix timestamp in the filename
  }
});

// Filter for image files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);  // Accept image files
  } else {
    cb(new Error('Only image files are allowed'), false);  // Reject non-image files
  }
};
// Multer setup with file storage, size limit, and filter
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit for file size
  fileFilter
}).single('file');  // Expecting a single file in the "file" field



const validateImageSize = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  sharp(req.file.path)
    .metadata()
    .then(metadata => {
      const { width, height } = metadata;
      const minWidth = 200;  // Minimum width (px)
      const minHeight = 200; // Minimum height (px)
      const maxWidth = 500;  // Maximum width (px)
      const maxHeight = 500; // Maximum height (px)

      if (width < minWidth || height < minHeight || width > maxWidth || height > maxHeight) {
        fs.unlinkSync(req.file.path); // Delete invalid file
        req.flash('message', `Invalid image dimensions. Allowed size: ${minWidth}x${minHeight} to ${maxWidth}x${maxHeight} pixels`);
        req.flash('alertType', 'error');
        return res.redirect(`/phm/campaign/qr/create`);
        
      }

      next();
    })
    .catch(err => {
      console.error("Error processing image:", err);
      return res.status(500).json({ error: "Failed to process image" });
    });
};

// Add this new middleware function
const conditionalFileUpload = (req, res, next) => {
  // Log incoming request details
  logger.info(`[Multer] Request method: ${req.method}`);
  logger.info(`[Multer] Content-Type: ${req.headers['content-type']}`);
  logger.info(`[Multer] Has body: ${!!req.body}`);
  logger.info(`[Multer] Body keys: ${Object.keys(req.body || {}).join(', ')}`);
  
  const contentType = req.headers['content-type'] || '';
  
  if (!contentType.includes('multipart/form-data')) {
    logger.warn(`[Multer] Not multipart/form-data, using urlencoded parser`);
    return express.urlencoded({ extended: true })(req, res, next);
  }
  
  logger.info(`[Multer] Processing multipart/form-data request`);
  
  // It's a multipart request, use multer
  upload(req, res, (err) => {
    if (err) {
      logger.error(`[Multer] Upload error: ${err.message}`);
      logger.error(err.stack);
      return next(err);
    }
    
    // Log what multer parsed
    logger.info(`[Multer] File received: ${!!req.file}`);
    if (req.file) {
      logger.info(`[Multer] File details: ${JSON.stringify({
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size
      })}`);
    }
    logger.info(`[Multer] Body fields: ${Object.keys(req.body || {}).join(', ')}`);
    
    // After successful upload, validate size if file exists
    if (req.file) {
      logger.info(`[Multer] Proceeding to image size validation`);
      return validateImageSize(req, res, next);
    }
    
    // No file, proceed to next middleware
    logger.info(`[Multer] No file uploaded, proceeding to controller`);
    next();
  });
};

if (!fs.existsSync(phishingCampaignDirectoryPath)) {
  fs.mkdirSync(phishingCampaignDirectoryPath, { recursive: true });
}

module.exports = {
  uploadFileMulterMiddleware: upload,
  validateImageSize,
  conditionalFileUpload // Export the new middleware
};