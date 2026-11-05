import { AppError } from '../../../common/errors/AppError';
import { AuthRepository } from './auth.repository';
import { config } from '../../../common/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OtpAttempts } from './otp';

export class MfaLoginService {
  private static hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private static generateAccessToken(user: any, sessionId: string): string {
    return jwt.sign(
      { id: user.id, role: user.role, fullName: user.fullName, sid: sessionId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );
  }

  private static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  static async verifyMfaLogin(emailOrPhone: string, code: string, deviceInfo: string, ipAddress: string) {
    emailOrPhone = emailOrPhone.trim().toLowerCase();
    const user = await AuthRepository.findUserByEmailOrPhone(emailOrPhone);
    if (!user) throw new AppError('User not found', 404);

    if (user.emailVerificationRequired && !user.emailVerifiedAt) throw new AppError('Verify your email before using Healix.', 403);
    if (user.deletedAt) throw new AppError('Account is unavailable.', 403);
    if (!user.mfaEnabled) throw new AppError('MFA is not enabled for this user', 400);

    if (user.status !== 'ACTIVE' && !(user.role === 'NURSE' && user.status === 'PENDING_VERIFICATION')) throw new AppError('Your account is not active.', 403);
    OtpAttempts.check(user.id, 'MFA_LOGIN');

    const activeOtp = await AuthRepository.findActiveOtp(user.id, code, 'MFA_LOGIN');
    if (!activeOtp) {
      OtpAttempts.fail(user.id, 'MFA_LOGIN');
      throw new AppError('Invalid or expired MFA code', 400);
    }

    await AuthRepository.consumeOtp(activeOtp.id);
    OtpAttempts.reset(user.id, 'MFA_LOGIN');

    const rawRefreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(rawRefreshToken);

    const session = await AuthRepository.createSession(
      user.id,
      refreshTokenHash,
      deviceInfo,
      ipAddress
    );

    return {
      tokens: { accessToken: this.generateAccessToken(user, session.id), refreshToken: rawRefreshToken },
      user: {
        id: user.id, email: user.email, phone: user.phone, fullName: user.fullName,
        role: user.role, status: user.status, createdAt: user.createdAt,
        patientId: user.patient?.id, nurseId: user.nurse?.id, doctorId: user.doctor?.id,
        paramedicId: user.paramedic?.id, adminId: user.admin?.id
      }
    };
  }
}
