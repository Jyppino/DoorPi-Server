export interface VerifyChallengeRequest {
  registerId?: string;
  id: string;
  answer: string;
}

export interface ChallengeRequest {
  id: string;
}

export interface IsRegisteredRequest {
  publicKey: string;
}

export interface RegisterRequest {
  publicKey: string;
  name: string;
  answer?: string;
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

export interface NameRequest {
  id: string;
  nameId: string;
  answer: string;
  name: string;
}
