import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { Key } from '../config/entities';
import { VerifyChallengeRequest, KeyNotFoundError } from '../models';

// Middleware that checks answer to challenge
export const verifyChallenge = function(req: Request, res: Response, next: NextFunction): void {
  const reqParams = req.body as VerifyChallengeRequest;
  const keyRepo = getRepository(Key);
  const isRegistering = reqParams.registrationKey !== undefined;
  const pubKey = reqParams.registrationKey ? reqParams.registrationKey : reqParams.publicKey;

  keyRepo
    .findOne({ publicKey: pubKey })
    .then(key => {
      if (!key) return next(new KeyNotFoundError(pubKey));

      const verifyError = key.verifyChallenge(reqParams.answer, isRegistering); // Verify answer to challenge

      keyRepo
        .save(key)
        .then(() => {
          if (verifyError) return next(verifyError); // Pass verification error to errorHandler
          next(); // Challenge answered correctly
        })
        .catch(err => {
          next(err);
        });
    })
    .catch(err => {
      next(err);
    });
};
