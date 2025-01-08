// routes/userRoutes.js
const express = require('express');
const userController = require('../controller/usercontroller');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/users', userController.create); 
router.post('/login', userController.login); 
router.get('/users/:email', userController.getByEmail); 
router.put('/users/:userId', userController.update); 
router.delete('/users/:userId', userController.delete); 

router.post('/request-password-reset', userController.requestPasswordReset);
// router.post('/reset-password', userController.resetPassword);
router.post('/verify',userController.verifyResetCode);
router.post('/reset-password',userController.updatePassword);
router.post('/logout', userController.logout);

module.exports = router;
