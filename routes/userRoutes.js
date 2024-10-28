// routes/userRoutes.js
const express = require('express');
const userController = require('../controller/usercontroller');

const router = express.Router();

router.post('/users', userController.create); // Create a new user
router.post('/login', userController.login); // Login user
router.get('/users/:email', userController.getByEmail); // Get user by email
router.put('/users/:userId', userController.update); // Update user information
router.delete('/users/:userId', userController.delete); // Delete a user
// In your routes file
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);
router.post('/logout', userController.logout);

module.exports = router;
