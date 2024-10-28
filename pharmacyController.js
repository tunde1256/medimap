const bcrypt = require('bcrypt');
const knex = require('../knex'); // Adjust to your Knex configuration path
const cloudinary = require('../middleware/cloudinary'); // Corrected the Cloudinary config path
const nodemailer = require('nodemailer'); // Make sure to install nodemailer

const pharmacyController = {
  // Register a new pharmacy
  async registerPharmacy(req, res) {
    const {
      fullname,
      email,
      password,
      phone_number,
      address,
      qualification,
      years_of_experience,
      pharmacy_name,
      pharmacy_address,
      pharmacy_contact_number,
    } = req.body;

    try {
      // Check if the email already exists
      const existingPharmacy = await knex('pharmacies').where({ email }).first();
      if (existingPharmacy) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Upload license if provided
      let license_url = null;
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        license_url = result.secure_url;
      }

      // Insert new pharmacy record
      const [newPharmacy] = await knex('pharmacies').insert({
        fullname,
        email,
        password: hashedPassword,
        phone_number,
        address,
        qualification,
        years_of_experience,
        pharmacy_name,
        pharmacy_address,
        pharmacy_contact_number,
        license_url,
      }).returning(['id', 'fullname', 'email', 'pharmacy_name', 'pharmacy_address']);

      // Send registration email
      await sendRegistrationEmail(newPharmacy.email, newPharmacy.fullname);

      res.status(201).json({ message: 'Pharmacy registered successfully', pharmacy: newPharmacy });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed', details: error.message });
    }
  },

  // Send registration confirmation email
  async sendRegistrationEmail(email, fullname) {
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // or another email service
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Registration Successful',
      text: `Hello ${fullname},\n\nThank you for registering your pharmacy. We are glad to have you on board!\n\nBest Regards,\nPharmacy Team`,
    };

    await transporter.sendMail(mailOptions);
  },

  // Forgot password function
  async forgotPassword(req, res) {
    const { email } = req.body;

    try {
      const pharmacy = await knex('pharmacies').where({ email }).first();
      if (!pharmacy) {
        return res.status(400).json({ error: 'Email not found' });
      }

      // Generate reset token
      const resetToken = generateResetToken(); 

      // Save the reset token in the database
      await knex('pharmacies').where({ email }).update({ reset_token: resetToken });

      // Send email with reset link
      await sendResetPasswordEmail(email, resetToken);

      res.status(200).json({ message: 'Reset password email sent' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send reset password email', details: error.message });
    }
  },

  // Reset password function
  async resetPassword(req, res) {
    const { token, newPassword } = req.body;

    try {
      // Find pharmacy with the reset token
      const pharmacy = await knex('pharmacies').where({ reset_token: token }).first();
      if (!pharmacy) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password and clear the reset token
      await knex('pharmacies').where({ id: pharmacy.id }).update({
        password: hashedPassword,
        reset_token: null,
      });

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Password reset failed', details: error.message });
    }
  },

  // Upload a drug to a pharmacy
  async uploadDrug(req, res) {
    const { name, location, drug_name, amount } = req.body;

    try {
      const existingPharmacy = await knex('pharmacies').where({ pharmacy_name: name }).first();
      if (!existingPharmacy) {
        return res.status(404).json({ error: 'Pharmacy not found' });
      }

      let drug_image_url = null;
      if (req.files && req.files.drug_image && req.files.drug_image.length > 0) {
        const filePath = req.files.drug_image[0].path; 
        const result = await cloudinary.uploader.upload(filePath);
        drug_image_url = result.secure_url;
      }

      const parsedAmount = parseInt(amount, 10);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ error: 'Invalid amount provided' });
      }

      await knex('drugs').insert({
        pharmacy_id: existingPharmacy.id,
        location,
        drug_name,
        amount: parsedAmount,
        drug_image_url,
      });

      res.status(201).json({ message: 'Drug uploaded successfully', drug_image_url });
    } catch (error) {
      res.status(400).json({ error: 'Drug upload failed', details: error.message });
    }
  },

  // Search for pharmacies that have a particular drug
  async searchPharmacies(req, res) {
    const { drug_name } = req.query;

    try {
      const pharmacies = await knex('drugs')
        .join('pharmacies', 'drugs.pharmacy_id', '=', 'pharmacies.id')
        .where('drugs.drug_name', 'like', `%${drug_name}%`)
        .select('pharmacies.*');

      if (pharmacies.length === 0) {
        return res.status(404).json({ message: 'No pharmacies found with the specified drug' });
      }
      res.status(200).json(pharmacies);
    } catch (error) {
      res.status(400).json({ error: 'Search failed', details: error.message });
    }
  },

  // Get a specific pharmacy by ID
  async getPharmacy(req, res) {
    const { pharmacyId } = req.params;

    try {
      const pharmacy = await knex('pharmacies').where({ id: pharmacyId }).first();
      if (!pharmacy) {
        return res.status(404).json({ message: 'Pharmacy not found' });
      }
      res.status(200).json(pharmacy);
    } catch (error) {
      res.status(400).json({ error: 'Get pharmacy failed', details: error.message });
    }
  },

  // Update a pharmacy's details
  async updatePharmacy(req, res) {
    const { pharmacyId } = req.params;
    const updates = req.body;

    try {
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        updates.license_url = result.secure_url;
      }

      const updatedPharmacy = await knex('pharmacies').where({ id: pharmacyId }).update(updates);
      if (!updatedPharmacy) {
        return res.status(404).json({ message: 'Pharmacy not found' });
      }
      res.status(200).json({ message: 'Pharmacy updated successfully' });
    } catch (error) {
      res.status(400).json({ error: 'Update failed', details: error.message });
    }
  },

  // Delete a pharmacy
  async deletePharmacy(req, res) {
    const { pharmacyId } = req.params;

    try {
      const deletedPharmacy = await knex('pharmacies').where({ id: pharmacyId }).del();
      if (!deletedPharmacy) {
        return res.status(404).json({ message: 'Pharmacy not found' });
      }
      res.status(200).json({ message: 'Pharmacy deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: 'Deletion failed', details: error.message });
    }
  },
};

// Helper function to send reset password email
async function sendResetPasswordEmail(email, resetToken) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please use the following token to reset your password: ${resetToken}\n\nIf you did not request this, please ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
}

// Implement your token generation logic
function generateResetToken() {
  return Math.random().toString(36).substring(2);
}

module.exports = pharmacyController;
