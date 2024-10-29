// migrations/xxxx_create_drugs_table.js

exports.up = function(knex) {
    return knex.schema.createTable('drugs', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.integer('quantity').notNullable().defaultTo(0);
      table.timestamps(true, true); // Adds created_at and updated_at fields
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('drugs');
  };
  