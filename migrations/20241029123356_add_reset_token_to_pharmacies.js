exports.up = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
      table.string('reset_token'); // Add reset_token column
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
      table.dropColumn('reset_token'); // Remove reset_token column
    });
  };
  