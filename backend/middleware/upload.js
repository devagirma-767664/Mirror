// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
  }
};

const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 2 * 1024 * 1024, files: 1 } });

module.exports = upload;
