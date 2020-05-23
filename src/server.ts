import express = require('express');
import cors = require('cors');
import * as http from 'http';
import * as bodyParser from 'body-parser';
import * as path from 'path';

import './config/db'; // Initialise database connection
import { challengeAuthRoute, serverApi } from './routes';
import { errorHandler, httpLogger } from './middleware';

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

app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => console.log(`Server running on localhost:${port}`)); // Start server

export default app; // For testing purposes
