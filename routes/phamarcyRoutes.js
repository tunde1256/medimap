const express = require('express');
const multer = require('multer'); // For file uploads
const pharmacyController = require('../controller/pharmacyController');
const router = express.Router();

// Adjust the uploads directory as needed
const upload = multer({ dest: 'uploads/' }).fields([
  { name: 'license', maxCount: 1 },
  { name: 'drug_image', maxCount: 1 }
]);

// Register route
router.post('/register', upload, pharmacyController.registerPharmacy);

// Login route
router.post('/login', pharmacyController.loginPharmacy);

// Forgot password route
router.post('/forgot-password', pharmacyController.forgotPassword);

// Reset password route
router.post('/reset-password', pharmacyController.resetPassword);

// Upload drug route
router.post('/upload-drug', upload, pharmacyController.uploadDrug);

// Search pharmacies route
router.get('/search', pharmacyController.searchPharmacies);

// Get random drugs route
router.get('/random-drugs', pharmacyController.getRandomDrugs);

module.exports = router;
