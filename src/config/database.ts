import { createConnection } from 'typeorm';
import { Key } from './entities';
import { databasePath } from './config';

createConnection({
  type: 'sqlite',
  database: process.env.NODE_ENV == 'TEST' ? databasePath.test : databasePath.regular,
  logging: false,
  entities: [Key]
})
  .then(connection => {
    connection
      .synchronize()
      .then(() => {
        console.log('Connected to SQLite database');
      })
      .catch(err => {
        console.log('SQLite database connection error: ' + err);
        process.exit(1);
      });
  })
  .catch(err => {
    console.log('SQLite database connection error: ' + err);
    process.exit(1);
  });
