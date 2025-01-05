require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors'); // Import CORS
const knex = require('knex'); // Import Knex

const dbConfig = require('./knexfile'); // Database configuration

// Initialize Knex with the development configuration
const db = knex(dbConfig.development);

// Test database connection
db.raw('SELECT 1+1 AS result')
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1); // Exit the application if the database connection fails
  });

// Import route files
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminroutes');
const pharmacyRoutes = require('./routes/phamarcyRoutes'); // Fixed typo (Phamarcy -> Pharmacy)

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Add CORS middleware
app.use(
  cors({
    origin: '*', // Allow all origins. Change to specific domains for production (e.g., 'http://yourdomain.com')
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  })
);


// Define routes
app.use('/api', userRoutes); // User routes
app.use('/api/admin', adminRoutes); // Admin routes
app.use('/api/pharmacy', pharmacyRoutes); // Pharmacy routes

// Default route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'An unexpected error occurred' });
});
app.use((req, res) => {
  if (req.path !== '/favicon.ico') {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
