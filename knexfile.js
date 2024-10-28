const knex = {
  development: {
    client: 'mysql2',
    connection: {
      host: 'localhost',
      user: 'root', // Your database username
      password: 'Tunde@2024', // Your database password
      database: 'mediapp', // Your database name
    },
    migrations: {
      directory: './migrations', // Migrations folder path
    },
    seeds: {
      directory: './seeds', // Seeds folder path
    },
  },
};
module.exports = knex; // Export the initialized Knex instance


// For production use a secure connection string instead of the above credentials.

