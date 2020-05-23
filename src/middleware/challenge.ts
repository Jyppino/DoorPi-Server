import { Request, Response, NextFunction } from 'express';
import { Key, KeyDocument } from '../config/models';
import { VerifyChallengeRequest, KeyNotFoundError } from '../models';

// Middleware that checks answer to challenge
export const verifyChallenge = function(req: Request, res: Response, next: NextFunction): void {
  const reqParams = req.body as VerifyChallengeRequest;
  const isRegistering = reqParams.registrationKey !== undefined;
  const pubKey = reqParams.registrationKey ? reqParams.registrationKey : reqParams.publicKey;
  Key.findOne(
    {
      publicKey: pubKey
    },
    function(err, key: KeyDocument) {
      if (err) return next(err);
      if (!key) return next(new KeyNotFoundError(pubKey));

      const verifyError = key.verifyChallenge(reqParams.answer, isRegistering); // Verify answer to challenge

      key.save(function(err) {
        if (err) return next(err);
        if (verifyError) return next(verifyError); // Pass verification error to errorHandler

        next(); // Challenge answered correctly
      });
    }
  );
};
