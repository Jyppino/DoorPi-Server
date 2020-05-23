export interface VerifyChallengeRequest {
  registrationKey?: string;
  publicKey: string;
  answer: string;
}

export interface ChallengeRequest {
  publicKey: string;
  registration?: boolean;
}

export interface RegisterRequest {
  publicKey: string;
  name: string;
}
