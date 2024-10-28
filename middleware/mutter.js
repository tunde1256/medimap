const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';

    // Check if the uploads folder exists; if not, create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

// Change to .fields to handle multiple files
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
}).fields([
  { name: 'license', maxCount: 1 }, // Adjust the name to your license field
  { name: 'drug_image', maxCount: 1 } // Add a field for drug image
]);

module.exports = upload;
