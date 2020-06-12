process.env.NODE_ENV = 'TEST';

import chai = require('chai');
import app from '../src/server';
import { serverSettings } from '../src/config/config';
import { getRepository } from 'typeorm';
import { Key } from '../src/config/entities';

const expect = chai.expect;
let publicKey = '';
let id = '';
let admin = false;

describe('Server API (UNIT)', function() {
  before(function(done) {
    const keyRepo = getRepository(Key);

    keyRepo
      .find({})
      .then(keys => {
        expect(keys.length).to.be.at.least(1);
        publicKey = keys[0].publicKey;
        id = keys[0].id;
        admin = keys[0].admin;
        done();
      })
      .catch(err => {
        done(err);
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
        expect(res.body).to.have.property('id');
        expect(res.body['id']).to.equal(id);
        expect(res.body['admin']).to.equal(admin);
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
        expect(res.body['admin']).to.be.false;
        expect(res.body).to.not.have.property('id');
        done();
      });
  });
});
