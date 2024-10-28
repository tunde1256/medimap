const express = require('express');
const multer = require('../middleware/mutter'); // Adjust the path according to your structure
const pharmacyController = require('../controller/pharmacyController'); // Adjust the path according to your structure
const upload = require('../middleware/mutter');

const router = express.Router();

// Route for registering a new pharmacy
router.post('/register', upload, pharmacyController.registerPharmacy);

// Route for uploading a drug to a pharmacy
router.post('/upload-drug', upload, pharmacyController.uploadDrug);

// Route for searching pharmacies by drug name
router.get('/search', pharmacyController.searchPharmacies);

// Route for getting a specific pharmacy by ID
router.get('/:pharmacyId', pharmacyController.getPharmacy);

// Route for updating a pharmacy's details
router.put('/:pharmacyId', upload, pharmacyController.updatePharmacy);

// Route for deleting a pharmacy
router.delete('/:pharmacyId', pharmacyController.deletePharmacy);

module.exports = router;
