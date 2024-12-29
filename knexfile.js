// // const knex = {
// //   development: {
// //     client: 'mysql2',
// //     connection: {
// //       host: 'sql202.infinityfree.com',
// //       user: 'if0_38002470', // Your database username
// //       password: 'ibFBWTLuOQ9', // Your database password
// //       database: 'if0_38002470_Medimap', // Your database name
// //     },
// //     migrations: {
// //       directory: './migrations', // Migrations folder path
// //     },
// //     seeds: {
// //       directory: './seeds', // Seeds folder path
// //     },
// //   },
// // };
// // module.exports = knex; // Export the initialized Knex instance



// module.exports = {
//   development: {
//     client: 'pg',
//     connection: {
//       host: 'us-east-1.092a9497-1997-4da5-9aa7-e16438e88fd8.aws.yugabyte.cloud',
//       user: 'admin',
//       password: 'GW29f4kyMh4wjhhN92_vXaKAk6mTHE',
//       database: 'yugabyte',
//       port: 5433,
//       ssl: {
//         rejectUnauthorized: false, // Allow self-signed certificates
//       },
//     },
//     migrations: {
//       directory: './migrations',
//     },
//     seeds: {
//       directory: './seeds',
//     },
//   },
// };
const fs = require('fs');

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '3kMb13KxpRLKo8g.root',
      password: 'yASR06Gsx9Wkl7AB',
      database: 'test',
      ssl: {
        ca: fs.readFileSync('/etc/ssl/certs/ca-certificates.crt'),
      },
    },
    migrations: {
      directory: './migrations', // Path to migration files
    },
    seeds: {
      directory: './seeds', // Path to seed files
    },
  },
};
