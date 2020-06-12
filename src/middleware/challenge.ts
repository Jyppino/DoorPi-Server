import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { Key } from '../config/entities';
import { VerifyChallengeRequest, KeyNotFoundError } from '../models';

// Declare key object as part of express Request interface
declare module 'express-serve-static-core' {
  interface Request {
    key?: Key;
    admin?: boolean;
  }
}

// Middleware that checks answer to challenge
export const verifyChallenge = function(req: Request, res: Response, next: NextFunction): void {
  const reqParams = req.body as VerifyChallengeRequest;
  const keyRepo = getRepository(Key);
  const id = reqParams.registerId !== undefined ? reqParams.registerId : reqParams.id;

  keyRepo
    .findOne({ id: id })
    .then(key => {
      if (!key) return next(new KeyNotFoundError(id));

      const verifyError = key.verifyChallenge(reqParams.answer); // Verify answer to challenge

      keyRepo
        .save(key)
        .then(() => {
          if (verifyError) return next(verifyError); // Pass verification error to errorHandler
          req.key = key; // Attach key to request object
          next(); // Challenge answered correctly
        })
        .catch(
          /* istanbul ignore next */ err => {
            next(err);
          }
        );
    })
    .catch(
      /* istanbul ignore next */ err => {
        next(err);
      }
    );
};
