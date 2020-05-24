process.env.NODE_ENV = 'TEST';

// Import test modules
import chai = require('chai');
import chaiHttp = require('chai-http');
import { getRepository } from 'typeorm';
import { Key } from '../src/config/entities';

// Setup chai
chai.use(chaiHttp);
chai.should();

import './challengeApi';
import './serverApi';
import './middlewareTest';

after(function(done) {
  const keyRepo = getRepository(Key);
  keyRepo
    .delete({})
    .then(() => {
      done();
    })
    .catch(err => {
      done(err);
    }); // Remove all keys from test database
});
