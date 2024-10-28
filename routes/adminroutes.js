const express = require('express');
const adminController = require('../controller/adminController');

const router = express.Router();

// Route to create a new admin
router.post('/admin/create', adminController.createAdmin);

// Route for admin login
router.post('/admin/login', adminController.login);

// Route to update admin
router.put('/admin/update/:adminId', adminController.updateAdmin);

// Route to delete admin
router.delete('/admin/delete/:adminId', adminController.deleteAdmin);

module.exports = router;
