export interface VerifyChallengeRequest {
  registerId?: string;
  id: string;
  answer: string;
}

export interface ChallengeRequest {
  id: string;
  register?: boolean;
}

export interface IsRegisteredRequest {
  publicKey: string;
}

export interface RegisterRequest {
  publicKey: string;
  name: string;
  admin: boolean;
}

export interface DeleteRequest {
  id: string;
  deleteId: string;
  anser: string;
}
