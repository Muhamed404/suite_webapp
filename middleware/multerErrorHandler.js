const multer = require('multer');

// Error handling middleware for Multer errors
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    console.error('Multer error:', err);
    //return res.status(400).json({ error: 'Multer error', message: err.message });
  } else if (err) {
    // An unknown error occurred when uploading
    console.error('Unknown error:', err);
    console.error('Unknown error:', err.code);
    //return res.status(500).json({ error: 'Unknown error', message: err.message });
  }
  next(); // Pass control to the next middleware if no error occurred
};

module.exports = multerErrorHandler;
