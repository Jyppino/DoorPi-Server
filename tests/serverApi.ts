process.env.NODE_ENV = 'TEST';

import chai = require('chai');
import app from '../src/server';
import { serverSettings } from '../src/config/config';
import { Key, KeyDocument } from '../src/config/models';

const expect = chai.expect;
let publicKey = '';

describe('Server API (UNIT)', function() {
  before(function(done) {
    Key.find({}, function(err, keys: KeyDocument[]) {
      if (err) return done(err);
      expect(keys.length).to.be.at.least(1);
      publicKey = keys[0].publicKey;
      done();
    });
  });

  it('Should be able to request server settings', function(done) {
    chai
      .request(app)
      .get('/getSettings')
      .end(function(err, res) {
        expect(err).to.be.null;
        res.should.have.status(200);
        res.body.should.be.a('object');
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('name');
        expect(res.body).to.have.property('setup');
        expect(res.body['id']).to.equal(serverSettings.id);
        expect(res.body['name']).to.equal(serverSettings.name);
        expect(res.body['setup']).to.be.false;
        done();
      });
  });

  it('Should be able to check registration with known key', function(done) {
    chai
      .request(app)
      .post('/isRegistered')
      .send({ publicKey: publicKey })
      .end(function(err, res) {
        expect(err).to.be.null;
        res.should.have.status(200);
        res.body.should.be.a('object');
        expect(res.body).to.have.property('registered');
        expect(res.body['registered']).to.be.true;
        done();
      });
  });

  it('Should be able to check registration with unknown key', function(done) {
    chai
      .request(app)
      .post('/isRegistered')
      .send({ publicKey: 'INCORRECT_KEY' })
      .end(function(err, res) {
        expect(err).to.be.null;
        res.should.have.status(200);
        res.body.should.be.a('object');
        expect(res.body).to.have.property('registered');
        expect(res.body['registered']).to.be.false;
        done();
      });
  });
});
