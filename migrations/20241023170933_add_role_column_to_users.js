exports.up = function (knex) {
    return knex.schema.table('users', function (table) {
      table.string('role').defaultTo('user'); // Add role column, defaulting to 'user'
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.table('users', function (table) {
      table.dropColumn('role'); // Drop the role column if rolling back
    });
  };
  