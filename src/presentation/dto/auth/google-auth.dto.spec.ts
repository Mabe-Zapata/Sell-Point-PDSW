import { validateSync } from 'class-validator';
import { LinkGoogleDto } from './google-link.dto';
import { LoginGoogleDto } from './google-login.dto';

describe('Google auth DTOs', () => {
  it('should accept a non-empty idToken for LinkGoogleDto', () => {
    const dto = Object.assign(new LinkGoogleDto(), { idToken: 'google-id-token' });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('should reject an empty idToken for LinkGoogleDto', () => {
    const dto = Object.assign(new LinkGoogleDto(), { idToken: '' });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('idToken');
  });

  it('should accept a non-empty idToken for LoginGoogleDto', () => {
    const dto = Object.assign(new LoginGoogleDto(), { idToken: 'google-id-token' });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('should reject an empty idToken for LoginGoogleDto', () => {
    const dto = Object.assign(new LoginGoogleDto(), { idToken: '' });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('idToken');
  });
});
