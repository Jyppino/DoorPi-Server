import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import crypto from 'crypto';
import { UnauthorizedError } from '../../models';
import forge from 'node-forge';

@Entity()
export class Key {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255, unique: true })
  publicKey: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('datetime', { default: Date.now() })
  created: Date;

  @Column({ default: false })
  admin: boolean;

  @Column('int', { default: 0 })
  unlocks: number;

  @Column('datetime', { nullable: true })
  latestUnlock?: Date;

  @Column('varchar', { length: 255, nullable: true })
  challenge?: string;

  @Column('datetime', { nullable: true })
  challengeExpiration?: Date;

  // Generate and store new challenge + expiration date
  generateChallenge = function(): string {
    const challenge = crypto.randomBytes(16).toString('hex'); // Generate challenge
    const expdate = new Date();
    expdate.setSeconds(expdate.getSeconds() + 120); // Challenge expires in 120 seconds
    // Store challenge + expiration date
    this.challenge = challenge;
    this.challengeExpiration = expdate;

    return challenge;
  };

  // Encrypt data using the users public key
  encryptWithPublicKey = function(toEncrypt: string): string {
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
  verifyChallenge = function(answer: string, isRegistering: boolean): UnauthorizedError | undefined {
    if (!(this.challenge && this.challengeExpiration)) return new UnauthorizedError('No challenge requested');

    const tokenExpired = new Date() > this.challengeExpiration; // Verify challenge expiration date
    const answeredCorrectly = this.challenge === answer; // Verify answer
    this.challenge = null; // Invalidate challenge
    this.challengeExpiration = null;

    if (tokenExpired) return new UnauthorizedError('Challenge expired');
    if (!answeredCorrectly) return new UnauthorizedError('Challenge answered incorrectly');

    if (!isRegistering) {
      this.unlocks += 1;
      this.latestUnlock = new Date();
    }
    return undefined;
  };
}
