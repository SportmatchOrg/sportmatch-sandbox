import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface FirebaseUser {
  uid: string;
  email: string;
  nombre: string;
  fotoUrl?: string;
}

export interface FirebaseIdToken extends DecodedIdToken {
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user: FirebaseUser;
}
