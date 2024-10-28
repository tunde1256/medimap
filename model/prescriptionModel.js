const knex = require('knex');
const dbConfig = require('../knexfile'); // Import your Knex configuration
const db = knex(dbConfig.development); // Initialize Knex

class Prescription {
  constructor(userId, drugName, dosage, doctorName, prescriptionImageUrl) {
    this.user_id = userId;
    this.drug_name = drugName;
    this.dosage = dosage;
    this.doctor_name = doctorName;
    this.prescription_image_url = prescriptionImageUrl; // This will store the Cloudinary URL
  }

  // Create a new prescription
  static async create(prescription) {
    try {
      const [id] = await db('prescriptions').insert(prescription).returning('id');
      return id;
    } catch (error) {
      throw new Error('Error creating prescription: ' + error.message);
    }
  }

  // Other methods (findById, update, delete) remain the same...
}

module.exports = Prescription;
