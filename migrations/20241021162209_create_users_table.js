exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
      table.increments('id'); // Auto-incrementing user ID
      table.string('full_name').notNullable(); // Full name of the user
      table.string('email').unique().notNullable(); // Unique email address
      table.string('phone_number').notNullable(); // Phone number of the user
      table.string('password').notNullable(); // Password field
      table.timestamps(true, true); // Created at and updated at timestamps
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('users'); // Drops the users table if rolling back
  };
  