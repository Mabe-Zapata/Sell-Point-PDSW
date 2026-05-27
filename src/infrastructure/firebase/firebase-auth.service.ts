import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { GoogleTokenPayload, IFirebaseAuth } from '../../application/ports/firebase-auth.interface';

@Injectable()
export class FirebaseAuthService implements IFirebaseAuth {
  async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      sub: decodedToken.uid,
      email: decodedToken.email ?? '',
      email_verified: decodedToken.email_verified ?? false,
    };
  }
}
