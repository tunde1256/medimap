// migrations/YYYYMMDDHHMMSS_add_location_to_pharmacies.js

exports.up = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
      table.string('location'); // Add the location column
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
      table.dropColumn('location'); // Remove the location column on rollback
    });
  };
  