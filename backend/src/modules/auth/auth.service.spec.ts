import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let auth: AuthService;
  let users: jest.Mocked<Pick<UsersService, 'findOrCreateByPhone'>>;
  let otp: jest.Mocked<Pick<OtpService, 'issue' | 'verify'>>;
  let jwt: JwtService;

  beforeEach(() => {
    users = { findOrCreateByPhone: jest.fn() };
    otp = { issue: jest.fn().mockResolvedValue(300), verify: jest.fn() };
    jwt = new JwtService({ secret: 'test-secret' });
    auth = new AuthService(
      users as unknown as UsersService,
      otp as unknown as OtpService,
      jwt,
    );
  });

  describe('requestOtp', () => {
    it('normalizes 8-prefixed numbers to +7', async () => {
      await auth.requestOtp('89001234567');
      expect(otp.issue).toHaveBeenCalledWith('+79001234567');
    });

    it('keeps international numbers as-is', async () => {
      await auth.requestOtp('+79001234567');
      expect(otp.issue).toHaveBeenCalledWith('+79001234567');
    });

    it('returns ttl', async () => {
      await expect(auth.requestOtp('+79001234567')).resolves.toEqual({
        sent: true,
        ttl: 300,
      });
    });
  });

  describe('verifyOtp', () => {
    it('rejects invalid code', async () => {
      otp.verify.mockResolvedValue(false);
      await expect(auth.verifyOtp('+79001234567', '0000')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(users.findOrCreateByPhone).not.toHaveBeenCalled();
    });

    it('issues token pair on success', async () => {
      otp.verify.mockResolvedValue(true);
      users.findOrCreateByPhone.mockResolvedValue({
        id: 'user-1',
        phone: '+79001234567',
      } as never);

      const tokens = await auth.verifyOtp('+79001234567', '1234');
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
      expect(tokens.accessToken).not.toEqual(tokens.refreshToken);
    });
  });

  describe('refresh', () => {
    it('rejects garbage token', async () => {
      await expect(auth.refresh('not-a-jwt')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
