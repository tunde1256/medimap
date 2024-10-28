const bcrypt = require('bcrypt');
const knex = require('../knex'); // Adjust to your Knex configuration path
const cloudinary = require('../middleware/cloidinary'); // Corrected the Cloudinary config path

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

      res.status(201).json({ message: 'Pharmacy registered successfully', pharmacy: newPharmacy });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed', details: error.message });
    }
  },

  // Upload a drug to a pharmacy
  async uploadDrug(req, res) {
    const { name, location, drug_name, amount } = req.body;

    try {
        // Check if the pharmacy with the provided name exists
        const existingPharmacy = await knex('pharmacies').where({ pharmacy_name: name }).first();

        // If the pharmacy does not exist, return an error
        if (!existingPharmacy) {
            return res.status(404).json({ error: 'Pharmacy not found' });
        }

        // Check if drug image file is provided and upload it to Cloudinary
        let drug_image_url = null;
        if (req.files && req.files.drug_image && req.files.drug_image.length > 0) {
            const filePath = req.files.drug_image[0].path; // Access the first uploaded drug image
            const result = await cloudinary.uploader.upload(filePath);
            drug_image_url = result.secure_url;
        }

        // Validate and parse amount
        const parsedAmount = parseInt(amount, 10);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            return res.status(400).json({ error: 'Invalid amount provided' });
        }

        // Insert drug details into the database
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
      const pharmacies = await knex('drugs') // Adjusted to search in the correct table
        .join('pharmacies', 'drugs.pharmacy_id', '=', 'pharmacies.id')
        .where('drugs.drug_name', 'like', `%${drug_name}%`)
        .select('pharmacies.*'); // Select fields from the pharmacies table

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
      // Upload license if a new file is provided
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

module.exports = pharmacyController;
