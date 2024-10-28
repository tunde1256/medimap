exports.up = async function(knex) {
    await knex.schema.createTable('prescriptions', (table) => {
      table.increments('id').primary(); // Auto-incrementing ID
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE'); // Foreign key to users table
      table.string('drug_name').notNullable(); // Drug name
      table.string('dosage').notNullable(); // Dosage
      table.string('doctor_name').notNullable(); // Doctor's name
      table.string('prescription_image_url'); // URL for the prescription image
      table.timestamps(true, true); // Created at and updated at timestamps
    });
  };
  
  exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('prescriptions');
  };
  