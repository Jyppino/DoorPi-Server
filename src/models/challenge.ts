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
}

export interface DeleteRequest {
  id: string;
  deleteId: string;
  answer: string;
}

export interface AdminRequest {
  id: string;
  adminId: string;
  answer: string;
  status: boolean;
}
