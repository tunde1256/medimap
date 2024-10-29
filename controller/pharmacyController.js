const bcrypt = require('bcrypt');
const knex = require('../knex'); // Adjust to your Knex configuration path
const cloudinary = require('../middleware/cloidinary'); // Corrected Cloudinary config path
const nodemailer = require('nodemailer'); // Make sure to install nodemailer
const Pharmacy = require('../model/pharmacyModel');
const Drug = require('../model/drugModel');

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
        if (req.files['license']) {
          const licenseResult = await cloudinary.uploader.upload(req.files['license'][0].path);
          license_url = licenseResult.secure_url;
        }
        if (req.files['drug_image']) {
          const drugImageResult = await cloudinary.uploader.upload(req.files['drug_image'][0].path);
          drug_image_url = drugImageResult.secure_url;
        }
      }

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

  // Login pharmacy
  async loginPharmacy(req, res) {
    const { email, password } = req.body;

    try {
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find the pharmacy by email with case-insensitive match
      const pharmacy = await knex('pharmacies').whereRaw('LOWER(email) = ?', [email.toLowerCase()]).first();
      console.log('Logging in pharmacy:', email);
      console.log('Retrieved pharmacy from DB:', pharmacy); // This should log the pharmacy data or null

      if (!pharmacy) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare the provided password with the hashed password
      const isPasswordValid = await bcrypt.compare(password, pharmacy.password);

      console.log('Stored hashed password:', pharmacy.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Remove sensitive information from the response
      const { password: _, ...pharmacyData } = pharmacy; // Exclude the password field

      // Respond with pharmacy data
      res.status(200).json({ message: 'Login successful', pharmacy: pharmacyData });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed', details: error.message });
    }
  },

  // Forgot password
  async forgotPassword(req, res) {
    const { email } = req.body;
    try {
      const pharmacy = await knex('pharmacies').where({ email }).first();
      if (!pharmacy) {
        return res.status(400).json({ error: 'Email not found' });
      }

      const resetToken = generateResetToken();
      await knex('pharmacies').where({ email }).update({ reset_token: resetToken });
      await sendResetPasswordEmail(email, resetToken);

      res.status(200).json({ message: 'Reset password email sent' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send reset password email', details: error.message });
    }
  },

  // Reset password
  async resetPassword(req, res) {
    const { token, newPassword } = req.body;
    try {
      const pharmacy = await knex('pharmacies').where({ reset_token: token }).first();
      if (!pharmacy) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await knex('pharmacies').where({ id: pharmacy.id }).update({
        password: hashedPassword,
        reset_token: null,
      });

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Password reset failed', details: error.message });
    }
  },

  // Upload drug
  async uploadDrug(req, res) {
    const { name, location, drug_name, amount } = req.body;

    try {
      if (!name || !location || !drug_name || !amount) {
        return res.status(400).json({ error: 'All fields are required: pharmacy name, location, drug name, and amount.' });
      }

      const pharmacy = await knex('pharmacies').where({ pharmacy_name: name }).first();
      if (!pharmacy) {
        return res.status(404).json({ error: 'Pharmacy not found' });
      }

      let drug_image_url = null;
      if (req.files && req.files.drug_image && req.files.drug_image.length > 0) {
        const result = await cloudinary.uploader.upload(req.files.drug_image[0].path);
        drug_image_url = result.secure_url;
      } else {
        return res.status(400).json({ error: 'No drug image file provided' });
      }

      await knex('drugs').insert({
        pharmacy_id: pharmacy.id,
        location,
        drug_name,
        amount,
        drug_image_url,
      });

      res.status(200).json({ message: 'Drug uploaded successfully', drug_image_url });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload drug', details: error.message });
    }
  },

  // Search pharmacies
  async searchPharmacies(req, res) {
    try {
      const { drugName, page = 1, pageSize = 10 } = req.query;
      const limit = parseInt(pageSize, 10);
      const offset = (parseInt(page, 10) - 1) * limit;

      if (!drugName) {
        return res.status(400).json({ error: 'Drug name is required' });
      }

      // Count total pharmacies with the specified drug
      const totalPharmaciesResult = await knex('pharmacies')
        .join('drugs', 'pharmacies.id', 'drugs.pharmacy_id') // Assuming drugs have a foreign key to pharmacies
        .where('drugs.drug_name', drugName) // Ensure 'drug_name' is the correct column
        .countDistinct('pharmacies.id as count');

      const totalPharmacies = totalPharmaciesResult[0].count;

      if (totalPharmacies === 0) {
        return res.status(404).json({ message: 'No pharmacies found with this drug.' });
      }

      // Retrieve paginated list of pharmacies with the specified drug
      const pharmacies = await knex('pharmacies')
        .join('drugs', 'pharmacies.id', 'drugs.pharmacy_id') // Same join as above
        .where('drugs.drug_name', drugName)
        .select('pharmacies.*')
        .limit(limit)
        .offset(offset);

      res.status(200).json({
        pharmacies,
        pagination: {
          total: parseInt(totalPharmacies, 10),
          page: parseInt(page, 10),
          pageSize: limit,
          totalPages: Math.ceil(totalPharmacies / limit),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  },

  // Get random drugs
  async getRandomDrugs(req, res) {
    const { page = 1, limit = 10 } = req.query; // Default values for pagination
    const offset = (page - 1) * limit;

    try {
      const drugs = await knex('drugs')
        .select('*')
        .orderByRaw('RAND()') // Randomly order the results
        .limit(limit)
        .offset(offset);

      res.status(200).json(drugs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve drugs', details: error.message });
    }
  },
};

// Function to generate a reset token (implementation can vary)
function generateResetToken() {
  return Math.random().toString(36).substring(2); // Simple random string
}

// Function to send registration email (you need to set up nodemailer)
async function sendRegistrationEmail(email, name) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'your-email@gmail.com', // Your email
      pass: 'your-email-password', // Your email password
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Registration Successful',
    text: `Hello ${name},\n\nThank you for registering with our pharmacy system!`,
  };

  await transporter.sendMail(mailOptions);
}

// Function to send reset password email
async function sendResetPasswordEmail(email, resetToken) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password',
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Password Reset',
    text: `You requested a password reset. Use this token: ${resetToken}`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = pharmacyController;
