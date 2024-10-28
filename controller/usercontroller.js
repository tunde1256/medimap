require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel'); // Ensure the correct path to the User model
const { promisify } = require('util');
const nodemailer = require('nodemailer'); // Import nodemailer
const crypto = require('crypto'); // Import crypto for generating secure random codes

// A temporary store for reset codes (you might want to store this in the database or use a cache like Redis)
const resetCodes = {}; 
const jwt_secret1 = process.env.jwt_secret; // Use environment variable for JWT secret

// Configure nodemailer transport for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail', // or any other email service provider
  auth: {
    user: process.env.EMAIL_USER, // Use environment variables for security
    pass: process.env.EMAIL_PASS, // Use environment variables for security
  },
});

const userController = {
  async create(req, res) {
    const { full_name, email, phone_number, password, confirm_password,role } = req.body;

    // Validate that the passwords match
    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create a new user without confirm_password
      const user = new User(full_name, email, phone_number, hashedPassword,role);
      
      // Insert the user into the database
      await User.create(user);

      // Send a welcome email
      const mailOptions = {
        from: process.env.EMAIL_USER, // Use environment variable for sender
        to: email,
        subject: 'Welcome to Medimap!',
        text: `Hi ${full_name},\n\nThank you for registering at MediApp!`,
      };

      await transporter.sendMail(mailOptions);

      res.status(201).json({ message: 'User created successfully and email sent' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password); // Compare passwords
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Create JWT token
      const token = jwt.sign({ userId: user.id }, jwt_secret1, { expiresIn: '1h' });
      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

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

  async update(req, res) {
    const { userId } = req.params;
    const updates = req.body;

    try {
      await User.update(userId, updates);
      res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    const { userId } = req.params;

    try {
      await User.delete(userId);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },



  async requestPasswordReset(req, res) {
    const { email } = req.body;
  
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Generate a random 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit number
  
      // Store the reset code temporarily (use a database for a real application)
      resetCodes[email] = resetCode;
  
      // Send password reset email with the reset code
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
  

async resetPassword(req, res) {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

  // Check if the reset code is valid
  if (!resetCodes[email] || resetCodes[email] !== resetCode) {
    return res.status(400).json({ error: 'Invalid or expired reset code' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
    await User.update(user.id, { password: hashedPassword });

    // Optionally, clear the reset code after use
    delete resetCodes[email];

    // Send password reset confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Successful',
      text: `Hi ${user.full_name},\n\nYour password has been successfully reset.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset successful and email sent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
},


async logout(req, res) {
  const authHeader = req.headers.authorization; // Get the Authorization header

  if (!authHeader) {
    return res.status(400).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from the header

  try {
    // Invalidate the token by setting a very short expiration (or store a token blacklist)
    await promisify(jwt.verify)(token, jwt_secret1);
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
},
}

module.exports = userController;
