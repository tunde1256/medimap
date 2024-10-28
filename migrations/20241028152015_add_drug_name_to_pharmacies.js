// migrations/YYYYMMDDHHMMSS_add_drug_name_to_pharmacies.js

exports.up = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
      table.string('drug_name'); // Add the drug_name column
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
      table.dropColumn('drug_name'); // Remove the drug_name column on rollback
    });
  };
  