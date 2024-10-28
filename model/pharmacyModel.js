// models/Pharmacy.js
const knex = require('../knex'); // Import Knex configuration

class Pharmacy {
  // Create a new pharmacy
  static async create(pharmacyData) {
    return await knex('pharmacies').insert(pharmacyData).returning('*');
  }

  // Find a pharmacy by its ID
  static async findById(id) {
    return await knex('pharmacies').where({ id }).first();
  }

  // Find a pharmacy by its email
  static async findByEmail(email) {
    return await knex('pharmacies').where({ email }).first();
  }

  // Update pharmacy details, including amount
  static async update(id, updates) {
    return await knex('pharmacies').where({ id }).update(updates).returning('*');
  }

  // Delete a pharmacy by its ID
  static async delete(id) {
    return await knex('pharmacies').where({ id }).del();
  }

  // Find pharmacies that offer a specific drug
  static async findPharmaciesWithDrug(drugName) {
    return await knex('pharmacies').where('drug_name', 'like', `%${drugName}%`).select('id', 'name', 'location', 'amount');
  }
}

module.exports = Pharmacy;
