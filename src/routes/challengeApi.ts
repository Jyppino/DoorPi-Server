import { Request, Response, NextFunction } from 'express';
import express = require('express');
import { getRepository } from 'typeorm';
import { Key } from '../config/entities';
import { body, matchedData } from 'express-validator';
import { validate, verifyChallenge } from '../middleware';
import {
  ChallengeRequest,
  KeyNotFoundError,
  UnauthorizedError,
  RegisterRequest,
  DeleteRequest,
  AdminRequest,
  InsufficientRightsError
} from '../models';

const router = express.Router();

// Keeps track of which key is currently registering a new key
let registerId: string | undefined = undefined;
const registerKey = function(req: Request, res: Response, next: NextFunction): void {
  const reqParams = matchedData(req) as RegisterRequest;
  const keyRepo = getRepository(Key);

  const newKey = new Key();
  newKey.publicKey = reqParams.publicKey;
  newKey.name = reqParams.name;
  newKey.admin = req.admin ? req.admin : false;

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
router.post('/challenge', [body('id').isString(), body('register').isBoolean()], validate, function(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const reqParams = matchedData(req) as ChallengeRequest;
  const keyRepo = getRepository(Key);

  keyRepo
    .findOne({ id: reqParams.id })
    .then(key => {
      if (!key) return next(new KeyNotFoundError(reqParams.id));

      const challenge = key.generateChallenge(); // Generate challenge
      const encryptedChallenge = key.encryptWithPublicKey(challenge); // Encrypt challenge

      if (reqParams.register) {
        if (!key.admin) return next(new InsufficientRightsError()); // Admin check
        registerId = key.id; // Store id of key that wants to register new key
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
router.post('/unlock', [body('id').isString(), body('answer').isString()], validate, verifyChallenge, function(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const key = req.key!;
  key.unlocks += 1;
  key.latestUnlock = new Date();
  getRepository(Key)
    .save(key)
    .then(() => {
      if (isProduction) {
        spawn('python', ['./unlock_door.py']);
      }
      res.json({ success: true });
    })
    .catch(err => {
      next(err);
    });
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
    if (!registerId) {
      const keyRepo = getRepository(Key);

      keyRepo
        .find({})
        .then(keys => {
          if (keys.length == 0) {
            req.admin = true;
            return registerKey(req, res, next); // First key that is registered, bypass security
          }
          next(new UnauthorizedError('No registration permitted'));
        })
        .catch(err => {
          next(err);
        });
    } else {
      req.body.registerId = registerId;
      registerId = undefined;
      next();
    }
  },
  verifyChallenge,
  registerKey
);

// Route to get list of registered keys
router.post('/keys', [body('id').isString(), body('answer').isString()], validate, verifyChallenge, function(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.key?.admin) return next(new InsufficientRightsError());
  const keyRepo = getRepository(Key);
  keyRepo
    .find({ select: ['name', 'id', 'latestUnlock', 'unlocks', 'admin'] })
    .then(keys => {
      res.json({ keys: keys });
    })
    .catch(err => {
      next(err);
    });
});

// Route to delete key
router.post(
  '/delete',
  [body('id').isString(), body('deleteId').isString(), body('answer').isString()],
  validate,
  verifyChallenge,
  function(req: Request, res: Response, next: NextFunction): void {
    const reqParams = matchedData(req) as DeleteRequest;
    const keyRepo = getRepository(Key);

    if (reqParams.id !== reqParams.deleteId && !req.key?.admin) return next(new InsufficientRightsError()); // Admin check

    keyRepo
      .delete({ id: reqParams.deleteId })
      .then(() => {
        res.json({ success: true });
      })
      .catch(err => {
        return next(err);
      });
  }
);

// Route to set admin rights of key
router.post(
  '/setAdmin',
  [body('id').isString(), body('adminId').isString(), body('answer').isString(), body('status').isBoolean()],
  validate,
  verifyChallenge,
  function(req: Request, res: Response, next: NextFunction): void {
    const reqParams = matchedData(req) as AdminRequest;
    const keyRepo = getRepository(Key);

    if (!req.key?.admin) return next(new InsufficientRightsError()); // Admin check

    keyRepo
      .findOne({ id: reqParams.adminId })
      .then(key => {
        if (!key) return next(new KeyNotFoundError(reqParams.adminId));
        key.admin = reqParams.status;

        keyRepo
          .save(key)
          .then(() => {
            res.json({ success: true });
          })
          .catch(err => {
            next(err);
          });
      })
      .catch(err => {
        next(err);
      });
  }
);

export const challengeAuthRoute = router;
