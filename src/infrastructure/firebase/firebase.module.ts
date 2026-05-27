/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Global, Module } from '@nestjs/common';
import { FirebaseAuthService } from './firebase-auth.service';
import { FIREBASE_AUTH_TOKEN } from '../common/injection-tokens';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_AUTH_TOKEN,
      useClass: FirebaseAuthService,
    },
  ],
  exports: [FIREBASE_AUTH_TOKEN],
})
export class FirebaseModule {}
