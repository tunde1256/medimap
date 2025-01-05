require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import CORS
const knex = require('knex');

const dbConfig = require('./knexfile');

const db = knex(dbConfig.development);

// Connect to the database
db.raw('SELECT 1+1 AS result')
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
  });

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminroutes');
const PharmacyRoutes = require('./routes/phamarcyRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Add CORS middleware
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Routes
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pharmacy', PharmacyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
