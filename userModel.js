const knex = require('knex'); // Import Knex
const dbConfig = require('../knexfile'); // Import your database configuration
const db = knex(dbConfig.development); // Initialize Knex with the development configuration

class User {
  constructor(fullName, email, phoneNumber, password, role = 'user') {
    this.full_name = fullName;
    this.email = email;
    this.phone_number = phoneNumber;
    this.password = password;
    this.role = role; // Set the role, defaulting to 'user'
  }

  // Create a new user in the database
  static async create(user) {
    try {
      const [userId] = await db('users').insert({
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        password: user.password,
        role: user.role,
      });
  
      // Fetch the newly created user
      const createdUser = await db('users').where('id', userId).first();
  
      console.log('Created user:', createdUser);
      return createdUser;
    } catch (error) {
      throw new Error('Error creating user: ' + error.message);
    }
  }
  

  // Find a user by email
  static async findByEmail(email) {
    try {
      return await db('users').where({ email }).first(); // Return the first user that matches the email
    } catch (error) {
      throw new Error('Error fetching user by email: ' + error.message);
    }
  }

  // Update user details
  static async update(userId, updates) {
    try {
      await db('users').where({ id: userId }).update(updates);
    } catch (error) {
      throw new Error('Error updating user: ' + error.message);
    }
  }

  // Delete a user by ID
  static async delete(userId) {
    try {
      const rowsDeleted = await db('users') // Replace 'users' with your actual table name
        .where({ id: userId }) // Ensure 'id' matches your table schema
        .del(); // Deletes the record
      return rowsDeleted;
    } catch (error) {
      throw new Error('Error deleting user: ' + error.message);
    }
  }
}

module.exports = User;
