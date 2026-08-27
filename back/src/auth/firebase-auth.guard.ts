import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';
import { AuthenticatedRequest, FirebaseIdToken, FirebaseUser } from './types';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(@Inject(FIREBASE_ADMIN) private readonly firebaseApp: App) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    request.user = this.toFirebaseUser(await this.decodeToken(token));

    return true;
  }

  private extractBearerToken(
    authorizationHeader: string | undefined,
  ): string | undefined {
    const [scheme, token] = authorizationHeader?.split(' ') ?? [];

    return scheme === 'Bearer' && token ? token : undefined;
  }

  private async decodeToken(token: string): Promise<FirebaseIdToken> {
    try {
      return await getAuth(this.firebaseApp).verifyIdToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private toFirebaseUser(decodedToken: FirebaseIdToken): FirebaseUser {
    if (!decodedToken.email) {
      throw new UnauthorizedException('Token does not contain an email');
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      nombre: decodedToken.name ?? decodedToken.email.split('@')[0],
      fotoUrl: decodedToken.picture,
    };
  }
}
