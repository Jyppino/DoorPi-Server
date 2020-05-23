import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import { Key, KeyDocument } from '../config/models';
import { ChallengeRequest } from '../models';
import { serverSettings } from '../config/config';
import { body, matchedData } from 'express-validator';
import { validate } from '../middleware';

const router = express.Router();

router.get('/getSettings', function(req: Request, res: Response, next: NextFunction): void {
  Key.find({}, function(err, keys) {
    if (err) return next(err);
    let setup = false;
    if (keys.length == 0) {
      setup = true;
    }
    res.json({ ...serverSettings, setup });
  });
});

router.post('/isRegistered', [body('publicKey').isString()], validate, function(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const reqParams = matchedData(req) as ChallengeRequest;
  Key.findOne({ publicKey: reqParams.publicKey }, function(err: Error, key: KeyDocument) {
    if (err) return next(err);
    let registered = false;
    if (key) registered = true;
    res.json({ registered });
  });
});

export const serverApi = router;
