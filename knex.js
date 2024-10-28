// knex.js
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development); // Initialize Knex with development configuration

module.exports = knex; // Export the initialized Knex instance
