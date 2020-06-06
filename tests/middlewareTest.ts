process.env.NODE_ENV = 'TEST';

import { getRepository } from 'typeorm';
import { Key } from '../src/config/entities';
import chai = require('chai');
import { verifyChallenge } from '../src/middleware';
import { Request, Response, NextFunction } from 'express';

const expect = chai.expect;

const tempChallenge = 'TEMPCHALLENGE';
const expdate = new Date();
expdate.setSeconds(expdate.getSeconds() + 30);
const testKeys = [
  {
    id: 'CHALLENGE_EXPIRED',
    name: 'CHALLENGE_EXPIRED',
    publicKey: 'CHALLENGE_EXPIRED',
    challenge: tempChallenge,
    challengeExpiration: new Date()
  },
  { id: 'NO_CHALLENGE', name: 'NO_CHALLENGE', publicKey: 'NO_CHALLENGE' },
  {
    id: 'INCORRECT_ANSWER',
    name: 'INCORRECT_ANSWER',
    publicKey: 'INCORRECT_ANSWER',
    challenge: tempChallenge,
    challengeExpiration: expdate
  },
  {
    id: 'CORRECT_ANSWER',
    name: 'CORRECT_ANSWER',
    publicKey: 'CORRECT_ANSWER',
    challenge: tempChallenge,
    challengeExpiration: expdate
  }
];

describe('Middleware (UNIT)', function() {
  describe('Challenge Verification', function() {
    before(function(done) {
      const keyQueryBuilder = getRepository(Key).createQueryBuilder();

      keyQueryBuilder
        .insert()
        .values(testKeys)
        .execute()
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        }); // Create temp test keys for the different tests
    });

    it('challengeVerify should provide an error if unknown key', function(done) {
      function callback(error: Error): void {
        expect(error.message).to.be.equal('Key not found for id: UNKNOWN ID');
        done();
      }
      verifyChallenge(
        { body: { id: 'UNKNOWN ID', answer: tempChallenge } } as Request,
        {} as Response,
        callback as NextFunction
      );
    });

    it('challengeVerify should provide an error if no challenge requested by key', function(done) {
      function callback(error: Error): void {
        expect(error.message).to.be.equal('No challenge requested');
        done();
      }
      verifyChallenge(
        { body: { id: 'NO_CHALLENGE', answer: tempChallenge } } as Request,
        {} as Response,
        callback as NextFunction
      );
    });

    it('challengeVerify should provide an error if challenge expired', function(done) {
      function callback(error: Error): void {
        expect(error.message).to.be.equal('Challenge expired');
        done();
      }
      verifyChallenge(
        { body: { id: 'CHALLENGE_EXPIRED', answer: tempChallenge } } as Request,
        {} as Response,
        callback as NextFunction
      );
    });

    it('challengeVerify should provide an error if challenge answered incorrectly', function(done) {
      function callback(error: Error): void {
        expect(error.message).to.be.equal('Challenge answered incorrectly');
        done();
      }
      verifyChallenge(
        { body: { id: 'INCORRECT_ANSWER', answer: 'INCORRECT_ANSWER' } } as Request,
        {} as Response,
        callback as NextFunction
      );
    });

    it('challengeVerify should call callback if challenge answered correctly', function(done) {
      function callback(error?: Error): void {
        expect(error).to.be.undefined;
        done();
      }
      verifyChallenge(
        { body: { id: 'CORRECT_ANSWER', answer: tempChallenge } } as Request,
        {} as Response,
        callback as NextFunction
      );
    });
  });
});
