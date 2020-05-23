import mongoose = require('mongoose');
import { mongodb } from './config';

// Setup MongoDB connection
const mongodbUri = process.env.NODE_ENV == 'TEST' ? mongodb.testUri : mongodb.uri; // For testing purposes
mongoose.connect(mongodbUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', function() {
  console.log('Connected to MongoDB database');
});
mongoose.connection.on('error', function(err) {
  console.log('MongdoDB database connection error: ' + err);
  process.exit(1);
});
mongoose.connection.on('disconnected', function() {
  console.log('Disconnected from MongoDB database');
});
