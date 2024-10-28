require('dotenv').config();
const Prescription = require('../model/prescriptionModel'); // Your Prescription model
const Pharmacy = require('../model/pharmacyModel'); // Assuming you have a Pharmacy model
const cloudinary = require('../middleware/cloidinary'); // Cloudinary config for file uploads
const ocrService = require('../ocrservice'); // Hypothetical OCR service for scanning prescriptions

const prescriptionController = {
  // Create a new prescription with image upload and drug availability check
  async create(req, res) {
    const { user_id, drug_name, dosage, doctor_name } = req.body;

    try {
      // Check if file is provided and upload it to Cloudinary
      let prescription_image_url = null;
      if (req.file) {
        // Cloudinary upload is handled by Multer in req.file
        const result = await cloudinary.uploader.upload(req.file.path); // Cloudinary upload
        prescription_image_url = result.secure_url;
      }

      // Scan the prescription image for drug names using an OCR service
      let extractedDrugName = drug_name;
      if (req.file && !drug_name) {
        extractedDrugName = await ocrService.scan(req.file.path); // Hypothetical OCR service
      }

      // Check for pharmacies that have the drug in stock
      const pharmaciesWithDrug = await Pharmacy.findPharmaciesWithDrug(extractedDrugName);

      // Create a new prescription record in the database
      const prescription = new Prescription(user_id, extractedDrugName, dosage, doctor_name, prescription_image_url);
      await Prescription.create(prescription);

      res.status(201).json({ 
        message: 'Prescription created and scanned successfully', 
        prescription_image_url,
        available_pharmacies: pharmaciesWithDrug 
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Retrieve a prescription by ID
  async getById(req, res) {
    const { prescriptionId } = req.params;

    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      res.status(200).json(prescription);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update a prescription
  async update(req, res) {
    const { prescriptionId } = req.params;
    const updates = req.body;

    try {
      await Prescription.update(prescriptionId, updates);
      res.status(200).json({ message: 'Prescription updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete a prescription
  async delete(req, res) {
    const { prescriptionId } = req.params;

    try {
      await Prescription.delete(prescriptionId);
      res.status(200).json({ message: 'Prescription deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = prescriptionController;
