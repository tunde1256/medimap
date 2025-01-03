require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel'); 
const { promisify } = require('util');
const nodemailer = require('nodemailer'); 
const crypto = require('crypto'); 
const resetCodes = {}; 
const jwt_secret1 = process.env.jwt_secret; 

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

const userController = {
  async create(req, res) {
    const { full_name, email, phone_number, password, confirm_password, role } = req.body;
  
    if (!full_name || !email || !phone_number || !password || !confirm_password || !role) {
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

      const token = jwt.sign({ userId: user.id }, process.env.jwt_secret1, { expiresIn: '1h' });
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
  

  async delete(req, res) {
    const { userId } = req.params;
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    try {
      console.log(`Attempting to delete user with ID: ${userId}`);
      const result = await User.delete(userId);
  
      console.log(`Delete result: ${result}`);
      if (result === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
  },
  


  async requestPasswordReset(req, res) {
    const { email } = req.body;
  
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); 
  
      resetCodes[email] = resetCode;
  
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

    const hashedPassword = await bcrypt.hash(newPassword, 10); 
    await User.update(user.id, { password: hashedPassword });

   
    delete resetCodes[email];

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
}

module.exports = userController;
