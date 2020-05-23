import { Request, Response, NextFunction } from 'express';
import express = require('express');
import { Key, KeyDocument } from '../config/models';
import { body, matchedData } from 'express-validator';
import { validate, verifyChallenge } from '../middleware';
import { ChallengeRequest, KeyNotFoundError, UnauthorizedError, RegisterRequest } from '../models';

const router = express.Router();

// Keeps track of which key is currently registering a new key
let registrationKey: string | undefined = undefined;
const registerKey = function(req: Request, res: Response, next: NextFunction): void {
  const reqParams = matchedData(req) as RegisterRequest;

  const newKey = new Key({
    publicKey: reqParams.publicKey,
    name: reqParams.name
  });

  newKey.save(function(err) {
    if (err) return next(err);
    res.json({ success: true }); // Confirm registration
  });
};

// Route to request challenge for key associated with URL parameter uid
router.post('/challenge', [body('publicKey').isString(), body('registration').isBoolean()], validate, function(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const reqParams = matchedData(req) as ChallengeRequest;
  Key.findOne(
    {
      publicKey: reqParams.publicKey
    },
    function(err, key: KeyDocument) {
      if (err) return next(err);
      if (!key) return next(new KeyNotFoundError(reqParams.publicKey));

      const challenge = key.generateChallenge(); // Generate challenge
      const encryptedChallenge = key.encryptWithPublicKey(challenge); // Encrypt challenge

      if (reqParams.registration) {
        registrationKey = key.publicKey;
      }
      key.save(function(err) {
        if (err) return next(err);
        res.json({ challenge: encryptedChallenge }); // Send challenge
      });
    }
  );
});

const spawn = require('child_process').spawn;

// Route to unlock with key
router.post('/unlock', [body('publicKey').isString(), body('answer').notEmpty()], validate, verifyChallenge, function(
  req: Request,
  res: Response
): void {
  // const pythonProcess = spawn('python',["./unlock_door.py"]);

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
      Key.find({}, function(err, keys: KeyDocument[]) {
        if (err) return next(err);
        if (keys.length == 0) {
          return registerKey(req, res, next); // First key that is registered, bypass security
        }
        next(new UnauthorizedError('No registration permitted'));
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
