exports.up = function(knex) {
    return knex.schema.createTable('admins', (table) => {
      table.increments('id').primary(); // Auto-incrementing ID
      table.string('full_name').notNullable();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.boolean('is_superadmin').defaultTo(false); // Boolean to differentiate between superadmin and normal admin
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('admins');
  };
  