// migrations/20241028150000_create_pharmacies_table.js

exports.up = function(knex) {
    return knex.schema.createTable('pharmacies', (table) => {
      table.increments('id').primary();
      table.string('fullname').notNullable();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('phone_number').notNullable();
      table.string('address').notNullable();
      table.string('qualification');
      table.integer('years_of_experience');
      table.string('pharmacy_name').notNullable();
      table.string('pharmacy_address').notNullable();
      table.string('pharmacy_contact_number').notNullable();
      table.string('license_url');
      table.timestamps(true, true); // created_at and updated_at timestamps
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('pharmacies');
  };
  