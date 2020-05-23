process.env.NODE_ENV = 'TEST';

// Import test modules
import chai = require('chai');
import chaiHttp = require('chai-http');
import { Key } from '../src/config/models';

// Setup chai
chai.use(chaiHttp);
chai.should();

import './challengeApi';
import './serverApi';
import './middlewareTest';

after(function(done) {
  // Remove all keys from test database
  Key.deleteMany({}, done);
});
