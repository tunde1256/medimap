// migrations/YYYYMMDDHHMMSS_add_drug_image_url_to_pharmacies.js

exports.up = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
      table.string('drug_image_url'); // Add the drug_image_url column
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
      table.dropColumn('drug_image_url'); // Remove the drug_image_url column on rollback
    });
  };
  