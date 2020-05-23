import * as mongoose from 'mongoose';
import crypto from 'crypto';
import { UnauthorizedError } from '../../models';
import forge from 'node-forge';

export interface KeyDocument extends mongoose.Document {
  publicKey: string;
  created: Date;
  name: string;
  unlocks: number;
  latestUnlock: Date;
  challenge?: string;
  challengeExpiration?: Date;
  generateChallenge: () => string;
  encryptWithPublicKey: (toEncrypt: string) => string;
  verifyChallenge: (answer: string, isRegistering: boolean) => UnauthorizedError | undefined;
}

const keySchema = new mongoose.Schema({
  publicKey: {
    type: String,
    unique: true,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true
  },
  unlocks: {
    type: Number,
    default: 0
  },
  latestUnlock: {
    type: Date
  },
  challenge: {
    type: String,
    required: function(): boolean {
      return (this as KeyDocument).challengeExpiration !== undefined;
    }
  },
  challengeExpiration: {
    type: Date,
    required: function(): boolean {
      return (this as KeyDocument).challenge !== undefined;
    }
  }
});

// Generate and store new challenge + expiration date
keySchema.methods.generateChallenge = function(): string {
  const challenge = crypto.randomBytes(16).toString('hex'); // Generate challenge
  const expdate = new Date();
  expdate.setSeconds(expdate.getSeconds() + 120); // Challenge expires in 120 seconds
  // Store challenge + expiration date
  this.challenge = challenge;
  this.challengeExpiration = expdate;

  return challenge;
};

// Encrypt data using the users public key
keySchema.methods.encryptWithPublicKey = function(toEncrypt: string): string {
  const pubKey = forge.pki.publicKeyFromPem(
    this.publicKey.startsWith('-----BEGIN PUBLIC KEY-----')
      ? this.publicKey
      : `-----BEGIN PUBLIC KEY-----${this.publicKey}-----END PUBLIC KEY-----`
  ) as forge.pki.rsa.PublicKey;

  const encrypted = pubKey.encrypt(toEncrypt, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: {
      md: forge.md.sha1.create()
    }
  });

  return forge.util.encode64(encrypted);
};

// Verify response of challenge, returns UnauthorizedError if unsuccessful
keySchema.methods.verifyChallenge = function(answer: string, isRegistering: boolean): UnauthorizedError | undefined {
  if (!(this.challenge && this.challengeExpiration)) return new UnauthorizedError('No challenge requested');

  const tokenExpired = new Date() > this.challengeExpiration; // Verify challenge expiration date
  const answeredCorrectly = this.challenge === answer; // Verify answer
  this.challenge = undefined; // Invalidate challenge
  this.challengeExpiration = undefined;

  if (tokenExpired) return new UnauthorizedError('Challenge expired');
  if (!answeredCorrectly) return new UnauthorizedError('Challenge answered incorrectly');

  if (!isRegistering) {
    this.unlocks += 1;
    this.latestUnlock = new Date();
  }
  return undefined;
};

export const Key = mongoose.model<KeyDocument>('Key', keySchema);
