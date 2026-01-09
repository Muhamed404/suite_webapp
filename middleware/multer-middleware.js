const moment = require('moment');
const multer = require("multer");
const ApplicationConstants = require('../contants/application-constants');
const { logger } = require("../logger/logger");

const FILE_SIZE_LIMIT_MB = 3;
const FILE_SIZE_LIMIT = FILE_SIZE_LIMIT_MB * 1024 * 1024;

const POSTERS_EXTENSIONS = ["pdf", "jpg", "png"];
const USERS_EXTENSIONS = ["csv"];

function getFileExtension(filename) {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex !== -1 ? filename.substring(dotIndex + 1).toLowerCase() : '';
}

const multerMiddleware = (fieldName) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let dest;
      if (["postersFile", "qrCampaign"].includes(fieldName)) {
        dest = ApplicationConstants.POSTERS_LIBRARY_DIR;
        logger.info(`Field name is ${fieldName}, using posters folder: ${dest}`);
      } else {
        dest = ApplicationConstants.PHISHMAGNUS_USERS_IMPORT_FILES;
        logger.info(`Field name is ${fieldName}, using users folder: ${dest}`);
      }
      if (!dest) {
        logger.error(`Destination directory is undefined for field: ${fieldName}`);
        return cb(new Error('Upload destination not configured'), null);
      }
      cb(null, dest);
    },
    filename: function (req, file, cb) {
      const unixTimestamp = moment().unix();
      const ext = getFileExtension(file.originalname);
      const categoryId = req.categoryId || req.body.category || null;
      let fileName;

      if (fieldName === 'postersFile') {
        if (categoryId) {
          fileName = `${categoryId}_${unixTimestamp}.${ext}`;
        } else {
          logger.error('fieldName is postersFile and the category value is null');
          fileName = `null_${unixTimestamp}_${file.originalname}`;
        }
        req.multerFileName = fileName.toLowerCase();
        logger.info(`new multerFileName file name is ${req.multerFileName}`);
        cb(null, req.multerFileName);
      } else {
        fileName = `${unixTimestamp}_${file.originalname}`;
        req.multerFileName = fileName.toLowerCase();
        logger.info(`new file name is ${req.multerFileName}`);
        cb(null, req.multerFileName);
      }
    },
  });

  return multer({
    storage: storage,
    limits: { fileSize: FILE_SIZE_LIMIT },
    fileFilter: function (req, file, cb) {
      const ext = getFileExtension(file.originalname);
      logger.info(`incoming file extension is: ${ext}`);

      let allowedExtensions = [];
      if (fieldName === "postersFile") {
        allowedExtensions = POSTERS_EXTENSIONS;
      } else if (fieldName === "qrCampaign") {
        allowedExtensions = POSTERS_EXTENSIONS;
      } else {
        allowedExtensions = USERS_EXTENSIONS;
      }

      if (!allowedExtensions.includes(ext)) {
        logger.error(`Invalid file extension: .${ext}. Allowed: ${allowedExtensions.join(", ")}`);
        return cb(new Error(`Invalid file extension. Only ${allowedExtensions.join("/")} files are allowed.`));
      }

      cb(null, true);
    },
  }).single(fieldName);
};

module.exports = multerMiddleware;
