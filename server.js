// app.js or index.js
require('dotenv').config(); // Load environment variables from.env file
const express = require('express');
const knex = require('knex'); // Import Knex

const dbConfig = require('./knexfile'); // Import your database configuration

const db = knex(dbConfig.development); // Initialize Knex with the development configuration

// Connect to the database
db.raw('SELECT 1+1 AS result').then(() => {
  console.log('Connected to the database');
}); 

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminroutes'); // Import admin routes
const PharmacyRoutes = require('./routes/phamarcyRoutes')

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies
app.use('/api', userRoutes); // Use user routes with a base path
app.use('/api/admin', adminRoutes);
app.use('/api/pharmacy', PharmacyRoutes); // Use pharmacy routes with a base path





app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
