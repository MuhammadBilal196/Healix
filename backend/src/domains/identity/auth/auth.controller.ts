import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/middleware/asyncHandler';
import { AuthService } from './auth.service';
import { sendSuccessResponse } from '../../../common/utils/response';

/**
 * Controller layer for Authentication endpoints.
 * Handles HTTP requests, forwards pre-validated payloads to AuthService, and formats responses.
 */

export const registerInvitedController = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.registerInvited(req.body);
  res.status(201).json({ success: true, message: 'Registration successful', data: result });
});

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  // Payload has already been validated and structured by validateRequest middleware
  const result = await AuthService.register(req.body);
  return sendSuccessResponse(
    res,
    'User registered successfully. Please verify the OTP sent to your email.',
    result,
    201
  );
});

export const verifyOtpController = asyncHandler(async (req: Request, res: Response) => {
  const { emailOrPhone, code } = req.body;
  const result = await AuthService.verifyOtp(emailOrPhone, code);

  const message = result.status === 'ACTIVE'
    ? 'Account verified and activated successfully.'
    : 'Account email verified successfully. Pending administrator verification.';

  return sendSuccessResponse(res, message, result, 200);
});

export const resendOtpController = asyncHandler(async (req: Request, res: Response) => {
  const { emailOrPhone } = req.body;
  await AuthService.resendOtp(emailOrPhone);
  return sendSuccessResponse(res, 'Verification OTP resent successfully.', null, 200);
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    deviceInfo: req.headers['user-agent'] || 'Unknown Device',
    ipAddress: req.ip || req.socket.remoteAddress
  };

  const result = await AuthService.login(payload);
  return sendSuccessResponse(res, 'Login successful.', result, 200);
});

export const googleLoginController = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.loginWithGoogle(req.body.credential, req.headers['user-agent'] || 'Unknown Device', req.ip || req.socket.remoteAddress);
  return sendSuccessResponse(res, 'Google login successful.', result, 200);
});

export const refreshController = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = req.ip || req.socket.remoteAddress;

  const result = await AuthService.refresh(refreshToken, deviceInfo, ipAddress);
  return sendSuccessResponse(res, 'Token refreshed successfully.', result, 200);
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await AuthService.logout(refreshToken);
  return sendSuccessResponse(res, 'Logged out successfully.', null, 200);
});

export const getMeController = asyncHandler(async (req: Request, res: Response) => {
  // req.user is injected by the protect middleware
  const user = (req as any).user;
  return sendSuccessResponse(res, 'User profile retrieved successfully.', {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    mfaEnabled: user.mfaEnabled,
    patientId: user.patient?.id,
    nurseId: user.nurse?.id,
    doctorId: user.doctor?.id,
    doctor: user.doctor ? { pmdcNumber: user.doctor.pmdcNumber, verificationStatus: user.doctor.verificationStatus, bio: user.doctor.bio, emergencyAvailable: user.doctor.emergencyAvailable, isProfessional: user.doctor.isProfessional } : undefined,
    paramedicId: user.paramedic?.id,
    adminId: user.admin?.id
  }, 200);
});

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const { emailOrPhone } = req.body;
  const result = await AuthService.forgotPassword(emailOrPhone);
  return sendSuccessResponse(res, result.message || 'If an account exists, password reset instructions have been sent.', null, 200);
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const { emailOrPhone, code, password } = req.body;
  await AuthService.resetPassword(emailOrPhone, code, password);
  return sendSuccessResponse(res, 'Password reset successfully.', null, 200);
});

export const changePasswordController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { oldPassword, newPassword } = req.body;
  await AuthService.changePassword(userId, oldPassword, newPassword);
  return sendSuccessResponse(res, 'Password changed successfully.', null, 200);
});
