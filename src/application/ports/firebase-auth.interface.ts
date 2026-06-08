export interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
}

export interface IFirebaseAuth {
  verifyIdToken(idToken: string): Promise<GoogleTokenPayload>;
}
