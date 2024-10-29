const bcrypt = require('bcrypt');
const knex = require('../knex'); // Adjust to your Knex configuration path
const cloudinary = require('../middleware/cloidinary'); // Corrected the Cloudinary config path
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
      // Check if email is already registered
      const existingPharmacy = await knex('pharmacies').where({ email }).first();
      if (existingPharmacy) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Upload files to Cloudinary if they are provided
      let license_url = null;
      let drug_image_url = null;

      if (req.files) {
        // Upload license if available
        if (req.files['license']) {
          const licenseResult = await cloudinary.uploader.upload(req.files['license'][0].path);
          license_url = licenseResult.secure_url;
        }

        // Upload drug image if available
        if (req.files['drug_image']) {
          const drugImageResult = await cloudinary.uploader.upload(req.files['drug_image'][0].path);
          drug_image_url = drugImageResult.secure_url;
        }
      }

      // Insert pharmacy record (without using .returning() for MySQL compatibility)
      const [newPharmacyId] = await knex('pharmacies').insert({
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
        drug_image_url,
      });

      // Retrieve the inserted pharmacy data using the ID
      const newPharmacy = await knex('pharmacies')
        .where({ id: newPharmacyId })
        .select('id', 'fullname', 'email', 'pharmacy_name', 'pharmacy_address')
        .first();

      if (!newPharmacy) {
        return res.status(500).json({ error: 'Failed to retrieve new pharmacy data' });
      }

      console.log("Sending registration email to:", newPharmacy.email);
      await sendRegistrationEmail(newPharmacy.email, newPharmacy.fullname);

      res.status(201).json({ message: 'Pharmacy registered successfully', pharmacy: newPharmacy });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed', details: error.message });
    }
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
    const { name, location, drug_name, amount } = req.body; // Get parameters from request body

    try {
      // Ensure required fields are provided
      if (!name || !location || !drug_name || !amount) {
        return res.status(400).json({ error: 'All fields are required: pharmacy name, location, drug name, and amount.' });
      }

      // Check if the pharmacy exists by name
      const pharmacy = await knex('pharmacies').where({ pharmacy_name: name }).first();
      if (!pharmacy) {
        return res.status(404).json({ error: 'Pharmacy not found' });
      }

      // Upload drug image if a file is provided
      let drug_image_url = null;
      if (req.files && req.files.drug_image && req.files.drug_image.length > 0) {
        const result = await cloudinary.uploader.upload(req.files.drug_image[0].path);
        drug_image_url = result.secure_url;
      } else {
        return res.status(400).json({ error: 'No drug image file provided' });
      }

      // Create a new drug record in the database
      await knex('drugs').insert({
        pharmacy_id: pharmacy.id, // Use the pharmacy ID
        location,
        drug_name,
        amount,
        drug_image_url,
      });

      // Respond with success and the new drug image URL
      res.status(200).json({ message: 'Drug uploaded successfully', drug_image_url });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload drug', details: error.message });
    }
  },

  // Search for pharmacies that have a particular drug
  async searchPharmacies(req, res) {
    // Implementation remains the same
  },

  // Get a specific pharmacy by ID
  async getPharmacy(req, res) {
    // Implementation remains the same
  },

  // Update a pharmacy's details
  async updatePharmacy(req, res) {
    // Implementation remains the same
  },

  // Delete a pharmacy
  async deletePharmacy(req, res) {
    // Implementation remains the same
  },
};

// Helper function to send registration email
async function sendRegistrationEmail(email, fullname) {
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
}

// Helper function to send reset password email
async function sendResetPasswordEmail(email, resetToken) {
  // Implementation remains the same
}

// Implement your token generation logic
function generateResetToken() {
  return Math.random().toString(36).substring(2);
}

module.exports = pharmacyController;
