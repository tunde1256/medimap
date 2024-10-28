exports.up = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
        table.decimal('amount', 10, 2); // Adjust the precision and scale as needed
    });
};

exports.down = function(knex) {
    return knex.schema.table('pharmacies', function(table) {
        table.dropColumn('amount');
    });
};
