/* eslint-disable @typescript-eslint/no-non-null-assertion */
process.env.NODE_ENV = 'TEST';

import chai = require('chai');
import app from '../src/server';
import { getRepository } from 'typeorm';
import { Key } from '../src/config/entities';
import forge from 'node-forge';

const expect = chai.expect;
const testUser = {
  name: 'TEST_USER',
  publicKey: '',
  privateKey: '',
  challenge: ''
};

const testUser2 = {
  name: 'TEST_USER2',
  publicKey: '',
  privateKey: '',
  challenge: ''
};

const incorrectUser = {
  name: 'INCORRECT_USER',
  publicKey: 'INCORRECT_PUBLICKEY',
  privateKey: 'INCORRECT_PRIVATEKEY'
};

before(function(done) {
  setTimeout(function() {
    console.log('\n');
    done();
  }, 500); // Wait for server to start
});

describe('Challenge Authentication (E2E)', function() {
  before(function(done) {
    // Create a temp key before running tests
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 }, function(err, keypair) {
      if (err) return done(err);
      testUser.publicKey = forge.pki.publicKeyToPem(keypair.publicKey); // Store public key for tests
      testUser.privateKey = forge.pki.privateKeyToPem(keypair.privateKey); // Store private key for tests
      done();
    });
  });

  before(function(done) {
    // Create a temp key before running tests
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 }, function(err, keypair) {
      if (err) return done(err);
      testUser2.publicKey = forge.pki.publicKeyToPem(keypair.publicKey); // Store public key for tests
      testUser2.privateKey = forge.pki.privateKeyToPem(keypair.privateKey); // Store private key for tests
      done();
    });
  });

  describe('Registration', function() {
    it('Should be able to register if first key to register', function(done) {
      const keyRepo = getRepository(Key);
      chai
        .request(app)
        .post('/register')
        .send({ publicKey: testUser.publicKey, name: testUser.name })
        .end(function(err, res) {
          expect(err).to.be.null;
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(res.body).to.have.property('success');
          expect(res.body['success']).to.be.true;

          keyRepo
            .find({})
            .then(keys => {
              expect(keys).to.be.length(1);
              done();
            })
            .catch(err => {
              done(err);
            });
        });
    });

    it('Should not be able to register if registration not requested', function(done) {
      chai
        .request(app)
        .post('/register')
        .send({ publicKey: incorrectUser.publicKey, name: incorrectUser.name })
        .end(function(err, res) {
          expect(err).to.be.null;
          res.should.have.status(401);
          expect(res.body.message).to.equal('No registration permitted');
          done();
        });
    });

    it('Should be able to request registration', function(done) {
      chai
        .request(app)
        .post('/challenge')
        .send({ publicKey: testUser.publicKey, registration: true })
        .end(function(err, res) {
          expect(err).to.be.null;
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(res.body).to.have.property('challenge');
          testUser.challenge = res.body.challenge;
          done();
        });
    });

    it('Should be able to register non-first key', function(done) {
      const privateKey = forge.pki.privateKeyFromPem(testUser.privateKey) as forge.pki.rsa.PrivateKey;
      const answer = privateKey.decrypt(forge.util.decode64(testUser.challenge), 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha1.create()
        }
      });
      const keyRepo = getRepository(Key);
      chai
        .request(app)
        .post('/register')
        .send({ publicKey: testUser2.publicKey, name: testUser2.name, answer })
        .end(function(err, res) {
          expect(err).to.be.null;
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(res.body).to.have.property('success');
          expect(res.body['success']).to.be.true;

          keyRepo
            .find({})
            .then(keys => {
              expect(keys).to.be.length(2);
              done();
            })
            .catch(err => {
              done(err);
            });
        });
    });
  });

  describe('Requesting challenge', function() {
    it('Should receive a challenge when requesting one', function(done) {
      chai
        .request(app)
        .post('/challenge')
        .send({ publicKey: testUser.publicKey, registration: false })
        .end(function(err, res) {
          expect(err).to.be.null;
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(res.body).to.have.property('challenge');
          testUser.challenge = res.body.challenge;
          done();
        });
    });

    it('Should not receive a challenge when key unknown', function(done) {
      chai
        .request(app)
        .post('/challenge')
        .send({ publicKey: incorrectUser.publicKey, registration: false })
        .end(function(err, res) {
          expect(err).to.be.null;
          res.should.have.status(404);
          expect(res.body.message).to.equal(`Key not found for public key: ${incorrectUser.publicKey}`);
          done();
        });
    });

    it('Database should have been updated correctly after challenge request', function(done) {
      const keyRepo = getRepository(Key);
      keyRepo
        .findOne({
          publicKey: testUser.publicKey
        })
        .then(key => {
          const pastExpdate = new Date();
          pastExpdate.setSeconds(pastExpdate.getSeconds() + 121);
          expect(key).to.not.be.null;
          expect(key!.challenge).to.be.a('string');
          expect(key!.challengeExpiration).to.be.a('Date');
          if (key!.challengeExpiration) {
            expect(key!.challengeExpiration.getTime()).to.be.lessThan(pastExpdate.getTime());
            done();
          }
        })
        .catch(err => {
          done(err);
        });
    });
  });

  describe('Unlocking', function() {
    describe('Correct', function() {
      it('Door should unlock if challenge answered correctly', function(done) {
        const privateKey = forge.pki.privateKeyFromPem(testUser.privateKey) as forge.pki.rsa.PrivateKey;
        const answer = privateKey.decrypt(forge.util.decode64(testUser.challenge), 'RSA-OAEP', {
          md: forge.md.sha256.create(),
          mgf1: {
            md: forge.md.sha1.create()
          }
        });

        chai
          .request(app)
          .post('/unlock')
          .send({ publicKey: testUser.publicKey, answer: answer })
          .end(function(err, res) {
            expect(err).to.be.null;
            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body).to.have.property('success');
            expect(res.body['success']).to.be.true;
            done();
          });
      });

      it('Database should have been updated correctly after unlock', function(done) {
        const keyRepo = getRepository(Key);
        keyRepo
          .findOne({
            publicKey: testUser.publicKey
          })
          .then(key => {
            expect(key).to.not.be.null;
            expect(key!.challenge).to.be.null;
            expect(key!.challengeExpiration).to.be.null;
            expect(key!.unlocks).to.equal(1);
            expect(key!.latestUnlock).to.be.a('Date');
            done();
          })
          .catch(err => {
            done(err);
          });
      });
    });

    describe('Incorrect', function() {
      const incorrectAnswer = 'INCORRECT_ANSWER';

      before(function(done) {
        chai
          .request(app)
          .post('/challenge')
          .send({ publicKey: testUser.publicKey, registration: false })
          .end(function(err) {
            if (!err) done();
          });
      });

      it('Door should not unlock if challenge answered incorrectly', function(done) {
        chai
          .request(app)
          .post('/unlock')
          .send({ publicKey: testUser.publicKey, answer: incorrectAnswer })
          .end(function(err, res) {
            expect(err).to.be.null;
            res.should.have.status(401);
            expect(res.body.message).to.equal('Challenge answered incorrectly');
            done();
          });
      });

      it('Database should have been updated correctly after incorrect answer', function(done) {
        const keyRepo = getRepository(Key);
        keyRepo
          .findOne({
            publicKey: testUser.publicKey
          })
          .then(key => {
            expect(key).to.not.be.null;
            expect(key!.challenge).to.be.null;
            expect(key!.challengeExpiration).to.be.null;
            expect(key!.unlocks).to.equal(1);
            done();
          })
          .catch(err => {
            done(err);
          });
      });

      it('Door should not unlock if challenge answered when not requested', function(done) {
        chai
          .request(app)
          .post('/unlock')
          .send({ publicKey: testUser.publicKey, answer: incorrectAnswer })
          .end(function(err, res) {
            expect(err).to.be.null;
            res.should.have.status(401);
            expect(res.body.message).to.equal('No challenge requested');
            done();
          });
      });

      it('Door should not unlock if challenge answered with unknown key', function(done) {
        chai
          .request(app)
          .post('/unlock')
          .send({ publicKey: incorrectUser.publicKey, answer: incorrectAnswer })
          .end(function(err, res) {
            expect(err).to.be.null;
            res.should.have.status(404);
            expect(res.body.message).to.equal(`Key not found for public key: ${incorrectUser.publicKey}`);
            done();
          });
      });
    });
  });
});
