exports.up = async function(knex) {
    await knex.schema.createTable('pharmacies', (table) => {
      table.increments('id').primary(); // Auto-incrementing ID
      table.string('name').notNullable(); // Pharmacy name
      table.string('location').notNullable(); // Pharmacy location
      // Add other fields as necessary
      table.timestamps(true, true); // Created at and updated at timestamps
    });
  };
  
  exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('pharmacies');
  };
  