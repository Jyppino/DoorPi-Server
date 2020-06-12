import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import { getRepository } from 'typeorm';
import { Key } from '../config/entities';
import { IsRegisteredRequest, IsRegisteredResponse } from '../models';
import { serverSettings } from '../config/config';
import { body, matchedData } from 'express-validator';
import { validate } from '../middleware';

const router = express.Router();

router.get('/getSettings', function(req: Request, res: Response, next: NextFunction): void {
  const keyRepo = getRepository(Key);

  keyRepo
    .find({})
    .then(keys => {
      let setup = false;
      if (keys.length == 0) {
        setup = true;
      }
      res.json({ ...serverSettings, setup });
    })
    .catch(err => {
      next(err);
    });
});

router.post('/isRegistered', [body('publicKey').isString()], validate, function(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const reqParams = matchedData(req) as IsRegisteredRequest;
  const keyRepo = getRepository(Key);

  keyRepo
    .findOne({ publicKey: reqParams.publicKey })
    .then(key => {
      const status: IsRegisteredResponse = {
        registered: false,
        id: undefined,
        admin: false
      };
      if (key) {
        status.registered = true;
        status.id = key.id;
        status.admin = key.admin;
      }
      res.json(status);
    })
    .catch(err => {
      next(err);
    });
});

export const serverApi = router;
