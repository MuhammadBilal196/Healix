import { z } from 'zod';
import { Role } from '@prisma/client';

// Password must be 8+ characters with at least one number and one special character
const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()[\]{}|_+=;:"'<>,.?/~`\-]).{8,}$/;

// Pakistan phone format: 03xxxxxxxxx or 92xxxxxxxxx or +92xxxxxxxxx
const phoneRegex = /^((\+92)|(0092)|(92)|0)?3\d{9}$/;

// Pakistani CNIC format: xxxxx-xxxxxxx-x
const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;

/**
 * Authentication request validation schemas.
 */
export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().regex(phoneRegex, 'Invalid Pakistan phone number format (e.g. 03001234567)'),
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters long'),
  password: z.string().regex(passwordRegex, 'Password must be 8+ characters with at least one number and one special character'),
  role: z.nativeEnum(Role).refine(r => r === Role.PATIENT || r === Role.NURSE, 'Only patients and nurses can sign up directly'),
  cnic: z.string().trim().optional(),
  pncNumber: z.string().trim().optional(),
  pmdcNumber: z.string().trim().optional(),
  certificationNumber: z.string().trim().optional(),
}).refine((data) => {
  if (data.role !== Role.ADMIN) {
    if (!data.cnic) return false;
    return cnicRegex.test(data.cnic);
  }
  return true;
}, {
  message: 'Valid CNIC in xxxxx-xxxxxxx-x format is required',
  path: ['cnic'],
}).refine((data) => {
  if (data.role === Role.NURSE) {
    return !!data.pncNumber && data.pncNumber.trim().length > 0;
  }
  return true;
}, {
  message: 'PNC registration number is required for nurses',
  path: ['pncNumber'],
}).refine((data) => {
  if (data.role === Role.DOCTOR) {
    return !!data.pmdcNumber && data.pmdcNumber.trim().length > 0;
  }
  return true;
}, {
  message: 'PMDC registration number is required for doctors',
  path: ['pmdcNumber'],
}).refine(data => data.role !== Role.PARAMEDIC || !!data.certificationNumber, {
  message: 'Certification number is required for paramedics',
  path: ['certificationNumber'],
});

export const registerInvitedSchema = z.object({
  invitationToken: z.string().min(1),
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  phone: z.string().trim().regex(phoneRegex),
  fullName: z.string().trim().min(3),
  password: z.string().regex(passwordRegex),
  cnic: z.string().trim().regex(cnicRegex),
  professionalId: z.string().trim().min(1).optional(),
  specialization: z.string().trim().min(1).optional()
});

export const mfaCodeSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

export const verifyOtpSchema = z.object({
  emailOrPhone: z.string().trim().min(1, 'Email or phone number is required'),
  code: z.string().regex(/^\d{6}$/, 'OTP code must be exactly 6 digits')
});

export const resendOtpSchema = z.object({
  emailOrPhone: z.string().trim().min(1, 'Email or phone number is required')
});

export const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required')
});

export const googleLoginSchema = z.object({ credential: z.string().min(100, 'Google credential is required') });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const forgotPasswordSchema = z.object({
  emailOrPhone: z.string().trim().min(1, 'Email or phone number is required')
});

export const resetPasswordSchema = z.object({
  emailOrPhone: z.string().trim().min(1, 'Email or phone number is required'),
  code: z.string().length(6, 'OTP code must be exactly 6 characters'),
  password: z.string().regex(passwordRegex, 'Password must be 8+ characters with at least one number and one special character')
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().regex(passwordRegex, 'Password must be 8+ characters with at least one number and one special character')
});
