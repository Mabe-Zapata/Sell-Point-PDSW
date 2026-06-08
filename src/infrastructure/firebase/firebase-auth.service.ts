import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';
import { GoogleTokenPayload, IFirebaseAuth } from '../../application/ports/firebase-auth.interface';

@Injectable()
export class FirebaseAuthService implements IFirebaseAuth {
  constructor(private readonly configService: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
    const app = this.getFirebaseApp();
    const decodedToken = await admin.auth(app).verifyIdToken(idToken);
    return {
      sub: decodedToken.uid,
      email: decodedToken.email ?? '',
      email_verified: decodedToken.email_verified ?? false,
    };
  }

  private getFirebaseApp(): admin.app.App {
    if (admin.apps.length > 0) {
      return admin.app();
    }

    const credential = this.getCredential();
    return admin.initializeApp({ credential });
  }

  private getCredential(): admin.credential.Credential {
    const sdkPath = this.configService.get<string>('firebase.adminSdkPath')
      ?? process.env.FIREBASE_ADMIN_SDK_PATH
      ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!sdkPath) {
      return admin.credential.applicationDefault();
    }

    const filePath = isAbsolute(sdkPath) ? sdkPath : resolve(process.cwd(), sdkPath);
    const serviceAccount = JSON.parse(readFileSync(filePath, 'utf8')) as admin.ServiceAccount;
    return admin.credential.cert(serviceAccount);
  }
}
