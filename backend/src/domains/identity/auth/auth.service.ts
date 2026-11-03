import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { RegisterPayload, LoginPayload, TokenResponse } from './auth.types';
import { AppError } from '../../../common/errors/AppError';
import { config } from '../../../common/config';
import { logger } from '../../../common/utils/logger';
import { Role, OtpChannel, UserStatus } from '@prisma/client';

/**
 * Service layer containing core business rules for Authentication.
 * Coordinates repository operations and handles cryptographic functions.
 */
import { RegisterInvitedUseCase } from './usecases/register-invited.usecase';
import { generateOtp, OtpAttempts } from './otp';
import { RegisterInvitedPayload } from './auth.types';
import { prisma } from '../../../common/config/database';
import { OtpDelivery } from './otp-delivery';
import { verifyGoogleIdToken } from './google-id-token';
export class AuthService {
  static async registerInvited(dto: RegisterInvitedPayload) {
    const { user } = await RegisterInvitedUseCase.execute(dto);
    const needsEmailVerification = user.role !== Role.DOCTOR && user.role !== Role.PARAMEDIC;
    if (needsEmailVerification) {
      OtpDelivery.assertConfigured();
      const code = generateOtp();
      await AuthRepository.createOtpCode(user.id, code, OtpChannel.EMAIL, new Date(Date.now() + 600000));
      await OtpDelivery.send(user.email, code, 'VERIFICATION');
    }
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, status: user.status },
      emailVerificationRequired: needsEmailVerification
    };
  }
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

  /**
   * Registers a new user. Performs checks for unique fields, hashes password, 
   * initiates verification by generating a 6-digit OTP code, and saves details.
   */
  public static async register(payload: RegisterPayload) {
    OtpDelivery.assertConfigured();
    // 1. Validate email uniqueness
    payload.email = payload.email.toLowerCase();
    const existingEmail = await AuthRepository.findUserByEmail(payload.email);
    if (existingEmail) {
      throw new AppError('Email is already registered', 409);
    }

    // 2. Validate phone uniqueness
    const existingPhone = await AuthRepository.findUserByPhone(payload.phone);
    if (existingPhone) {
      throw new AppError('Phone number is already registered', 409);
    }

    // 3. Hash raw password securely using bcrypt
    const passwordHash = await bcrypt.hash(payload.password, 12);

    // 4. Create base user and role-specific rows inside a transaction
    const user = await AuthRepository.createUser(payload, passwordHash);

    // 5. Generate a 6-digit verification OTP code
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    await AuthRepository.createOtpCode(user.id, code, OtpChannel.EMAIL, expiresAt);

    await OtpDelivery.send(user.email, code, 'VERIFICATION');

    return {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    };
  }

  /**
   * Validates an OTP code and activates Patient status, or maintains Nurse/Doctor status pending admin review.
   */
  public static async verifyOtp(emailOrPhone: string, code: string) {
    emailOrPhone = emailOrPhone.toLowerCase();
    const user = await AuthRepository.findUserByEmailOrPhone(emailOrPhone);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.deletedAt) throw new AppError('Account is unavailable.', 403);
    if (user.status === UserStatus.SUSPENDED) throw new AppError('Your account has been suspended.', 403);
    OtpAttempts.check(user.id, 'VERIFICATION');
    const otp = await AuthRepository.findActiveOtp(user.id, code);
    if (!otp) {
      OtpAttempts.fail(user.id, 'VERIFICATION');
      throw new AppError('Invalid or expired OTP code', 400);
    }

    // Mark OTP code consumed to prevent replay attacks
    await AuthRepository.consumeOtp(otp.id);
    OtpAttempts.reset(user.id, 'VERIFICATION');
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });

    let updatedStatus = user.status;
    if (user.role === Role.PATIENT || user.role === Role.ADMIN) {
      // Patients and invitation-only administrators are activated automatically after verifying their OTP
      updatedStatus = UserStatus.ACTIVE;
      await AuthRepository.updateUserStatus(user.id, updatedStatus);
      logger.info(`User ${user.email} (PATIENT) successfully verified OTP and activated.`);
    } else {
      // Nurses and Doctors remain PENDING_VERIFICATION for admin approval, even after verifying OTP
      logger.info(`User ${user.email} (${user.role}) verified OTP, waiting for Admin review.`);
    }

    return {
      userId: user.id,
      role: user.role,
      status: updatedStatus
    };
  }

  /**
   * Re-issues a new OTP code, subject to rate limits.
   */
  public static async resendOtp(emailOrPhone: string) {
    emailOrPhone = emailOrPhone.toLowerCase();
    const user = await AuthRepository.findUserByEmailOrPhone(emailOrPhone);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Enforce rate limit: max 5 OTP requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtpsCount = await AuthRepository.countRecentOtps(user.id, oneHourAgo);

    if (recentOtpsCount >= 5) {
      throw new AppError('Too many OTP requests. Please try again in an hour.', 429);
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await AuthRepository.createOtpCode(user.id, code, OtpChannel.EMAIL, expiresAt);
    OtpAttempts.reset(user.id, 'VERIFICATION');
    await OtpDelivery.send(user.email, code, 'VERIFICATION');

    return { success: true };
  }

  /**
   * Authenticates user, issues access and refresh tokens, and registers the session.
   */
  public static async login(payload: LoginPayload): Promise<any> {
    payload.emailOrPhone = payload.emailOrPhone.toLowerCase();
    const user = await AuthRepository.findUserByEmailOrPhone(payload.emailOrPhone);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password match
    const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.emailVerificationRequired && !user.emailVerifiedAt) throw new AppError('Please verify your OTP code to activate your account.', 403);
    // Enforce status checks
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      if (user.role === Role.PATIENT) {
        throw new AppError('Please verify your OTP code to activate your account.', 403);
      }
      if (user.role !== Role.NURSE) throw new AppError('Your account is pending administrator verification.', 403);
    }

    if (user.deletedAt) throw new AppError('Account is unavailable.', 403);
    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    if (user.mfaEnabled) {
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await AuthRepository.createOtpCode(user.id, code, OtpChannel.EMAIL, expiresAt, 'MFA_LOGIN');
      OtpAttempts.reset(user.id, 'MFA_LOGIN');
      await OtpDelivery.send(user.email, code, 'MFA_LOGIN');
      return { mfaRequired: true, message: 'MFA verification required' };
    }

    return this.createLoginSession(user, payload.deviceInfo, payload.ipAddress);
  }

  public static async loginWithGoogle(credential: string, deviceInfo?: string, ipAddress?: string): Promise<any> {
    const { email } = await verifyGoogleIdToken(credential);
    const user = await AuthRepository.findUserByEmail(email);
    if (!user || user.deletedAt) throw new AppError('No Healix account uses this Google address.', 403);
    if (user.emailVerificationRequired && !user.emailVerifiedAt) throw new AppError('Please verify your Healix email first.', 403);
    if (user.status !== UserStatus.ACTIVE && !(user.role === Role.NURSE && user.status === UserStatus.PENDING_VERIFICATION)) {
      throw new AppError('Your account is not active.', 403);
    }
    if (user.mfaEnabled) {
      const code = generateOtp();
      await AuthRepository.createOtpCode(user.id, code, OtpChannel.EMAIL, new Date(Date.now() + 600000), 'MFA_LOGIN');
      OtpAttempts.reset(user.id, 'MFA_LOGIN');
      await OtpDelivery.send(user.email, code, 'MFA_LOGIN');
      return { mfaRequired: true, email: user.email, message: 'MFA verification required' };
    }
    return this.createLoginSession(user, deviceInfo, ipAddress);
  }

  private static async createLoginSession(user: any, deviceInfo?: string, ipAddress?: string) {
    // Generate token set
    const rawRefreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(rawRefreshToken);

    // Save hashed session details for token validation
    const session = await AuthRepository.createSession(
      user.id,
      refreshTokenHash,
      deviceInfo,
      ipAddress
    );

    return {
      tokens: {
        accessToken: this.generateAccessToken(user, session.id),
        refreshToken: rawRefreshToken
      },
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        patientId: user.patient?.id,
        nurseId: user.nurse?.id,
        doctorId: user.doctor?.id,
        paramedicId: user.paramedic?.id
      }
    };
  }

  /**
   * Exchanges a valid refresh token for a new access token + refresh token set (Token Rotation).
   */
  public static async refresh(refreshToken: string, deviceInfo?: string, ipAddress?: string): Promise<TokenResponse> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    
    const session = await AuthRepository.findSessionByTokenHash(refreshTokenHash);
    if (!session || session.revoked || session.expiresAt <= new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    if (session.user.deletedAt || (session.user.emailVerificationRequired && !session.user.emailVerifiedAt)) throw new AppError('Account is unavailable or email is unverified.', 403);
    if (session.user.status !== UserStatus.ACTIVE && !(session.user.role === Role.NURSE && session.user.status === UserStatus.PENDING_VERIFICATION)) throw new AppError('Your account is not active.', 403);

    // Generate new token pair
    const rawRefreshToken = this.generateRefreshToken();
    const newHash = this.hashRefreshToken(rawRefreshToken);

    // Save new rotating session
    const rotatedSession = await AuthRepository.rotateSession(
      session.id,
      session.userId,
      newHash,
      deviceInfo || session.deviceInfo || undefined,
      ipAddress || session.ipAddress || undefined
    );

    return {
      accessToken: this.generateAccessToken(session.user, rotatedSession.id),
      refreshToken: rawRefreshToken
    };
  }

  /**
   * Revokes a session upon user logout.
   */
  public static async logout(refreshToken: string) {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const session = await AuthRepository.findSessionByTokenHash(refreshTokenHash);
    if (!session) {
      throw new AppError('Invalid token', 400);
    }

    await AuthRepository.revokeSession(session.id);
    return { success: true };
  }

  /**
   * Initiates password reset by sending a verification OTP code.
   */
  public static async forgotPassword(emailOrPhone: string) {
    emailOrPhone = emailOrPhone.toLowerCase();
    const user = await AuthRepository.findUserByEmailOrPhone(emailOrPhone);
    if (!user) {
      logger.info(`Password reset requested for unknown user: ${emailOrPhone}`);
      return { success: true, message: 'If an account exists, password reset instructions have been sent.' };
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await AuthRepository.createOtpCode(user.id, code, OtpChannel.EMAIL, expiresAt, 'PASSWORD_RESET');
    OtpAttempts.reset(user.id, 'PASSWORD_RESET');
    await OtpDelivery.send(user.email, code, 'PASSWORD_RESET');

    // Same response as the unknown-account branch, so the reply never reveals whether an account exists.
    return { success: true, message: 'If an account exists, password reset instructions have been sent.' };
  }

  /**
   * Resets password using valid verification OTP.
   */
  public static async resetPassword(emailOrPhone: string, code: string, newPassword: string) {
    emailOrPhone = emailOrPhone.toLowerCase();
    const user = await AuthRepository.findUserByEmailOrPhone(emailOrPhone);
    if (!user) {
      // Same error as a wrong code, so this endpoint cannot be used to discover registered accounts.
      throw new AppError('Invalid or expired password reset verification code', 400);
    }

    OtpAttempts.check(user.id, 'PASSWORD_RESET');
    const activeOtp = await AuthRepository.findActiveOtp(user.id, code, 'PASSWORD_RESET');
    if (!activeOtp) {
      OtpAttempts.fail(user.id, 'PASSWORD_RESET');
      throw new AppError('Invalid or expired password reset verification code', 400);
    }

    // Hash new password securely
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password inside transaction and invalidate user sessions
    await AuthRepository.resetPasswordTransaction(user.id, passwordHash, activeOtp.id);
    OtpAttempts.reset(user.id, 'PASSWORD_RESET');

    return { success: true };
  }

  /**
   * Changes password for authenticated active session.
   */
  public static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Incorrect current password', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await AuthRepository.updatePasswordAndRevokeSessions(userId, passwordHash);

    return { success: true };
  }
}
