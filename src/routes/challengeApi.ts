import { Request, Response, NextFunction } from 'express';
import express = require('express');
import { getRepository } from 'typeorm';
import { Key } from '../config/entities';
import { body, matchedData } from 'express-validator';
import { validate, verifyChallenge } from '../middleware';
import { ChallengeRequest, KeyNotFoundError, UnauthorizedError, RegisterRequest } from '../models';

const router = express.Router();

// Keeps track of which key is currently registering a new key
let registrationKey: string | undefined = undefined;
const registerKey = function(req: Request, res: Response, next: NextFunction): void {
  const reqParams = matchedData(req) as RegisterRequest;
  const keyRepo = getRepository(Key);

  const newKey = new Key();
  newKey.publicKey = reqParams.publicKey;
  newKey.name = reqParams.name;

  keyRepo
    .save(newKey)
    .then(() => {
      res.json({ success: true }); // Confirm registration
    })
    .catch(err => {
      next(err);
    });
};

// Route to request challenge for key associated with URL parameter uid
router.post('/challenge', [body('publicKey').isString(), body('registration').isBoolean()], validate, function(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const reqParams = matchedData(req) as ChallengeRequest;

  const keyRepo = getRepository(Key);

  keyRepo
    .findOne({ publicKey: reqParams.publicKey })
    .then(key => {
      if (!key) return next(new KeyNotFoundError(reqParams.publicKey));

      const challenge = key.generateChallenge(); // Generate challenge
      const encryptedChallenge = key.encryptWithPublicKey(challenge); // Encrypt challenge

      if (reqParams.registration) {
        registrationKey = key.publicKey;
      }

      keyRepo
        .save(key)
        .then(() => {
          res.json({ challenge: encryptedChallenge }); // Send challenge
        })
        .catch(err => {
          next(err);
        });
    })
    .catch(err => {
      next(err);
    });
});

const spawn = require('child_process').spawn;
const isProduction = process.env.NODE_ENV == 'PRODUCTION';

// Route to unlock with key
router.post('/unlock', [body('publicKey').isString(), body('answer').notEmpty()], validate, verifyChallenge, function(
  req: Request,
  res: Response
): void {
  if (isProduction) {
    spawn('python', ['./unlock_door.py']);
  }
  res.json({ success: true });
});

// Route to register first or new key
router.post(
  '/register',
  [
    body('publicKey').notEmpty(),
    body('name').notEmpty(),
    body('answer')
      .optional()
      .isString()
  ],
  validate,
  function(req: Request, res: Response, next: NextFunction): void {
    if (!registrationKey) {
      const keyRepo = getRepository(Key);

      keyRepo
        .find({})
        .then(keys => {
          if (keys.length == 0) {
            return registerKey(req, res, next); // First key that is registered, bypass security
          }
          next(new UnauthorizedError('No registration permitted'));
        })
        .catch(err => {
          next(err);
        });
    } else {
      req.body.registrationKey = registrationKey;
      registrationKey = undefined;
      next();
    }
  },
  verifyChallenge,
  registerKey
);

export const challengeAuthRoute = router;
