// const multer = require("multer");

// const MB = 0; // 5 MB
// const FILE_SIZE_LIMIT = MB * 1024 * 1024;

// const configureMulter = (fieldName) => {
//   const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//      
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, file.originalname + "-" + uniqueSuffix);
//     },
//   });

//   const allowedFileExtensions = ["csv"]; // List of allowed file extensions
//   const maxFileSize = FILE_SIZE_LIMIT; //10 * 1024 * 1024; // Maximum file size limit: 10 MB

//   return multer({
//     storage: storage,
//     limits: { fileSize: maxFileSize }, // Set file size limit
//     fileFilter: function (req, file, cb) {
//       // Check if the file extension is in the allowed list
//       console.log(
//         `incoming file extension is:  ${file.originalname
//           .split(".")
//           .pop()
//           .toLowerCase()}`
//       );
//       const isValidFileExtension = allowedFileExtensions.includes(
//         file.originalname.split(".").pop().toLowerCase()
//       );

//       // Check if the file size is within the limit
//       //console.log(req);
//       console.log(
//         `incoming file size ${file.size} and allowd size limit ${maxFileSize}`
//       );
//       const isValidFileSize = file.size <= maxFileSize;
//       //console.log(file)
//       if (!isValidFileExtension) {
//         req.fileValidationError = new Error(
//           "Invalid file extension. Only .csv files are allowed."
//         );
//         return cb(req.fileValidationError);
//       }

       
//       //   if (!isValidFileSize) {
//       //     req.fileValidationError = new Error(
//       //       `File size exceeds the limit of ${maxFileSize} bytes.`
//       //     );
//       //     return cb(req.fileValidationError);
//       //   }
//       cb(null, true);
//     },
   
//   }).single(fieldName);
// };

// module.exports = configureMulter;
