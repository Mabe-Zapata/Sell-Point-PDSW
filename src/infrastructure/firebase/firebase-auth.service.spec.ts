import { Test } from '@nestjs/testing';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthService } from './firebase-auth.service';

describe('FirebaseAuthService', () => {
  let service: FirebaseAuthService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FirebaseAuthService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = moduleRef.get(FirebaseAuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize firebase admin from the SDK file when no app exists', async () => {
    jest.spyOn(admin, 'apps', 'get').mockReturnValue([]);
    const credential = { projectId: 'test' } as any;
    const certSpy = jest.spyOn(admin.credential, 'cert').mockReturnValue(credential);
    const applicationDefaultSpy = jest.spyOn(admin.credential, 'applicationDefault').mockReturnValue(credential);
    const initializeSpy = jest.spyOn(admin, 'initializeApp').mockReturnValue({} as any);
    const verifyIdToken = jest.fn().mockResolvedValue({
      uid: 'google-uid-123',
      email: 'google@test.com',
      email_verified: true,
    });
    jest.spyOn(admin, 'auth').mockReturnValue({ verifyIdToken } as any);

    const result = await service.verifyIdToken('token');

    expect(configService.get).toHaveBeenCalledWith('firebase.adminSdkPath');
    expect(applicationDefaultSpy).toHaveBeenCalled();
    expect(certSpy).not.toHaveBeenCalled();
    expect(initializeSpy).toHaveBeenCalled();
    expect(verifyIdToken).toHaveBeenCalledWith('token');
    expect(result).toEqual({
      sub: 'google-uid-123',
      email: 'google@test.com',
      email_verified: true,
    });
  });
});
