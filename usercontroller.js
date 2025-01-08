require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const { promisify } = require('util');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const resetRequests = {};
const jwt_secret1 = process.env.jwt_secret;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const userController = {
  // User creation
  async create(req, res) {
    const { full_name, email, phone_number, password, confirm_password, role } = req.body;

    if (!full_name || !email || !phone_number || !password || !confirm_password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { full_name, email, phone_number, password: hashedPassword, role };
      const createdUser = await User.create(user);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to MediApp!',
        text: `Hi ${full_name},\n\nThank you for registering at MediApp!`,
      };

      await transporter.sendMail(mailOptions);

      res.status(201).json({
        user: {
          id: createdUser.id,
          full_name: createdUser.full_name,
          email: createdUser.email,
          phone_number: createdUser.phone_number,
          role: createdUser.role,
        },
        message: 'User created successfully and email sent',
      });
    } catch (error) {
      res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
  },

  // User login
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.jwt_secret1, { expiresIn: '1h' });
      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get user by email
  async getByEmail(req, res) {
    const { email } = req.params;

    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update user details
  async update(req, res) {
    const { userId } = req.params;
    const updates = req.body;

    try {
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      const updatedRows = await User.update(userId, updates);

      if (updatedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await User.findById(userId);

      res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message || 'Failed to update user' });
    }
  },

  // Delete user
  async delete(req, res) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const result = await User.delete(userId);

      if (result === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
  },

  
  async  requestPasswordReset(req, res) {
    const { email } = req.body;
  
    try {
      // Check if the user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Generate a random 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      resetRequests[email] = { resetCode }; // Store the reset code and email temporarily
  
      console.log(resetRequests);
      console.log(`Reset code for ${email}: ${resetCode}`); // Log for debugging
  
      // Send the reset code to the user's email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        text: `Hi ${user.full_name},\n\nTo reset your password, please use the following code:\n\n${resetCode}\n\nThank you!`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: 'Password reset code sent to email' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async verifyResetCode(req, res) {
    const { resetCode } = req.body; // Only accept the resetCode in the body
  
    console.log(`Verifying reset code: ${resetCode}`); // Log for debugging
  
    // Find the email associated with the reset code in resetRequests
    const email = Object.keys(resetRequests).find(
      (key) => resetRequests[key].resetCode === resetCode
    );
  
    if (!email) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }
  
    // Mark the reset code as verified
    resetRequests[email].verified = true;
  
    console.log(`Reset code verified for ${email}. Code not removed yet.`); // Log for debugging
  
    // Store email temporarily in resetRequests
    resetRequests[email].email = email;
  
    res.status(200).json({ message: 'Reset code verified successfully' });
  },
  

  async updatePassword(req, res) {
    const { newPassword, confirmPassword } = req.body;
  
    // Ensure the email exists in resetRequests and is verified
    const email = Object.keys(resetRequests).find(
      (key) => resetRequests[key].verified === true
    );
  
    if (!email) {
      return res.status(400).json({ error: 'Email is missing or unauthorized request' });
    }
  
    console.log(`Updating password for ${email}`); // Log for debugging
  
    // Verify that the new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
  
    try {
      // Find the user by email stored in resetRequests
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the user's password in the database
      await User.update(user.id, { password: hashedPassword });
  
      // Send confirmation email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Successful',
        text: `Hi ${user.full_name},\n\nYour password has been successfully reset.`,
      };
      await transporter.sendMail(mailOptions);
  
      // Remove email from resetRequests store after use (for security)
      delete resetRequests[email];
  
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
  },
  
  

  // Logout
  async logout(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(400).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      await promisify(jwt.verify)(token, process.env.jwt_secret1);
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  },
};

module.exports = userController;
