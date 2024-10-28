const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const upload = require('../config/multerConfig'); // Import Multer configuration for file upload

// Prescription routes
router.post('/prescriptions', upload.single('prescription_image'), prescriptionController.create);  // Upload prescription image
router.get('/prescriptions/:prescriptionId', prescriptionController.getById);
router.put('/prescriptions/:prescriptionId', prescriptionController.update);
router.delete('/prescriptions/:prescriptionId', prescriptionController.delete);

module.exports = router;
