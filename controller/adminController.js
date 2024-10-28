const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Admin = require('../model/adminModel'); // Ensure correct path to Admin model

const adminController = {
  async createAdmin(req, res) {
    const { full_name, email, password, is_superadmin } = req.body;

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the admin
      const newAdmin = new Admin(full_name, email, hashedPassword, is_superadmin);
      const adminId = await Admin.create(newAdmin);

      res.status(201).json({ message: 'Admin created successfully', adminId });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const admin = await Admin.findByEmail(email);
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      res.status(200).json({ message: 'Login successful', admin });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateAdmin(req, res) {
    const { adminId } = req.params;
    const updates = req.body;

    try {
      await Admin.update(adminId, updates);
      res.status(200).json({ message: 'Admin updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteAdmin(req, res) {
    const { adminId } = req.params;

    try {
      await Admin.delete(adminId);
      res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Reset Password Functionality
  async resetPassword(req, res) {
    const { email } = req.body;

    try {
      const user = await Admin.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate a random 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000);

      // Update the user with the reset code (Store it temporarily in the database)
      await Admin.update(user.id, { reset_code: resetCode });

      // Set up Nodemailer for sending the reset code
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_ADDRESS,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Prepare email content
      const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: user.email,
        subject: 'Password Reset Code',
        text: `Hi ${user.full_name},\n\nPlease use the following code to reset your password: ${resetCode}\n\nThis code is valid for a limited time.\n\nThank you!`,
      };

      // Send the email
      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: 'Password reset code sent to your email' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Function to Change Password Using the Reset Code
  async changePassword(req, res) {
    const { email, resetCode, newPassword } = req.body;

    try {
      const user = await Admin.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify the reset code
      if (user.reset_code !== resetCode) {
        return res.status(400).json({ error: 'Invalid reset code' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password and remove the reset code
      await Admin.update(user.id, { password: hashedPassword, reset_code: null });

      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = adminController;



