import express = require('express');
import cors = require('cors');
import * as http from 'http';
import * as https from 'https';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as fs from 'fs';

import './config/database'; // Initialise database connection
import { challengeAuthRoute, serverApi } from './routes';
import { errorHandler, httpLogger } from './middleware';
import { certificatePath } from './config/config';

import 'reflect-metadata';

const port = process.env.PORT || '3000';
const app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(cors());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(httpLogger);

app.use('', serverApi);
app.use('', challengeAuthRoute);

// Error handler
app.use(errorHandler);

const isProduction = process.env.NODE_ENV == 'PRODUCTION';
if (isProduction) {
  const options = {
    key: fs.readFileSync(certificatePath.key),
    cert: fs.readFileSync(certificatePath.cert)
  };
  const server = https.createServer(options, app);
  server.listen(port, () => console.log(`Server running production on port: ${port}`)); // Start HTTPS server
} else {
  const server = http.createServer(app);
  server.listen(port, () => console.log(`Server running development on port: ${port}`)); // Start HTTP server
}

export default app; // For testing purposes
