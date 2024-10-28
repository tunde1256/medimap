exports.up = function(knex) {
    return knex.schema.createTable('drugs', function(table) {
      table.increments('id').primary(); // Primary key
      table.integer('pharmacy_id').unsigned().references('id').inTable('pharmacies').onDelete('CASCADE'); // Foreign key to pharmacies table
      table.string('drug_name').notNullable(); // Drug name
      table.string('drug_image_url'); // URL for drug image
      table.string('location'); // Location
      table.integer('amount').notNullable(); // Amount
      table.timestamps(true, true); // Adds created_at and updated_at fields
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('drugs'); // Rollback function to drop the table
  };
  