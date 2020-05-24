import { createConnection } from 'typeorm';
import { Key } from './entities';
import path from 'path';

const dbPath = `${path.resolve(__dirname, '../..')}/db.sqlite`;
const dbTestPath = `${path.resolve(__dirname, '../..')}/db-test.sqlite`;

createConnection({
  type: 'sqlite',
  database: process.env.NODE_ENV == 'TEST' ? dbTestPath : dbPath,
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
