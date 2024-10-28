const knex = require('knex');
const dbConfig = require('../knexfile'); // Import your Knex configuration
const db = knex(dbConfig.development); // Initialize Knex

class Admin {
  constructor(fullName, email, password, isSuperadmin = false) {
    this.full_name = fullName;
    this.email = email;
    this.password = password;
    this.is_superadmin = isSuperadmin;
  }

  // Create a new admin
  static async create(admin) {
    try {
      const [id] = await db('admins').insert(admin).returning('id');
      return id;
    } catch (error) {
      throw new Error('Error creating admin: ' + error.message);
    }
  }

  // Retrieve an admin by email
  static async findByEmail(email) {
    try {
      const admin = await db('admins').where({ email }).first();
      return admin;
    } catch (error) {
      throw new Error('Error finding admin: ' + error.message);
    }
  }

  // Update an admin's information
  static async update(adminId, updates) {
    try {
      await db('admins').where({ id: adminId }).update(updates);
      return 'Admin updated successfully';
    } catch (error) {
      throw new Error('Error updating admin: ' + error.message);
    }
  }

  // Delete an admin
  static async delete(adminId) {
    try {
      await db('admins').where({ id: adminId }).del();
      return 'Admin deleted successfully';
    } catch (error) {
      throw new Error('Error deleting admin: ' + error.message);
    }
  }
}

module.exports = Admin;
