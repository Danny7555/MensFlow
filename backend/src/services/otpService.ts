import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { User } from '../models/User';
import { getJwtSecret } from '../config/env';
import { httpError } from '../utils/http';
import { withRetry } from '../utils/retry';
import { logger } from '../utils/logger';

const OTP_EXPIRY_MINUTES = 10;
const OTP_TEMP_TOKEN_MINUTES = 15;

// ─── Generate a secure 6-digit OTP ───────────────────────────────────────────

function generateOtpCode(): string {
  const bytes = crypto.randomBytes(3);
  const num = bytes.readUIntBE(0, 3) % 1_000_000;
  return num.toString().padStart(6, '0');
}

// ─── Build the OTP email HTML ─────────────────────────────────────────────────

function buildOtpEmailHtml(name: string, code: string, expiryMins: number): string {
  const digits = code.split('').map(d =>
    `<span class="digit-box" style="display:inline-block;width:40px;height:52px;line-height:52px;text-align:center;font-size:26px;font-weight:700;color:#1a0a14;background:#f8f0f5;border:2px solid #f0d8e8;border-radius:12px;margin:0 3px;">${d}</span>`
  ).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>MensFlow Verification Code</title>
  <style>
    @media only screen and (max-width: 520px) {
      .main-table {
        padding: 20px 0 !important;
      }
      .main-card {
        width: 100% !important;
        border-radius: 16px !important;
      }
      .header-td {
        padding: 20px 24px !important;
      }
      .content-td {
        padding: 28px 20px 20px !important;
      }
      .footer-td {
        padding: 16px 20px 20px !important;
      }
      .digit-box {
        width: 34px !important;
        height: 46px !important;
        line-height: 46px !important;
        font-size: 22px !important;
        margin: 0 2px !important;
        border-radius: 8px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f8f0f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table class="main-table" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f0f5;padding:40px 0;">
    <tr><td align="center">
      <table class="main-card" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(220,80,130,0.08);width:100%;max-width:520px;">
        <tr>
          <td class="header-td" style="background:linear-gradient(135deg,#e84393,#f472b6);padding:28px 36px;">
            <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">MensFlow</span>
            <span style="font-size:11px;color:rgba(255,255,255,0.7);margin-left:8px;text-transform:uppercase;letter-spacing:0.15em;">Security</span>
          </td>
        </tr>
        <tr>
          <td class="content-td" style="padding:36px 36px 28px;">
            <p style="margin:0 0 6px;font-size:13px;color:#9b6b86;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Hi, ${name}</p>
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1a0a14;">Your verification code</h1>
            <p style="margin:0 0 28px;font-size:14px;color:#5c3d52;line-height:1.6;">
              Enter this code in MensFlow to verify your identity. It expires in <strong>${expiryMins} minutes</strong>.
            </p>
            <div style="text-align:center;margin:0 0 28px;white-space:nowrap;word-break:keep-all;">${digits}</div>
            <p style="margin:0;font-size:12px;color:#b09ba8;line-height:1.5;">
              If you didn't request this code, you can safely ignore this email.<br/>
              Never share your verification code with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td class="footer-td" style="padding:16px 36px 24px;border-top:1px solid #f3e4ed;">
            <p style="margin:0;font-size:11px;color:#b09ba8;">© MensFlow — <a href="https://mens-flow-f7jm.vercel.app/settings" style="color:#e84393;text-decoration:none;">Manage security settings</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ─── SMTP transporter factory ─────────────────────────────────────────────────

async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!host || !smtpUser || !smtpPass) {
    // Fallback to Ethereal for development — prints a preview URL to the console
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });
}

// ─── Temp JWT (pre-auth session — only valid for OTP verification step) ───────

function signOtpTempToken(userId: string): string {
  const secret = getJwtSecret();
  return jwt.sign(
    { id: userId, type: 'otp_session' },
    secret,
    { expiresIn: `${OTP_TEMP_TOKEN_MINUTES}m` } as jwt.SignOptions
  );
}

export function verifyOtpTempToken(token: string): { id: string } {
  const secret = getJwtSecret();
  const payload = jwt.verify(token, secret) as { id: string; type: string };
  if (payload.type !== 'otp_session') {
    throw httpError('Invalid OTP session token', 401);
  }
  return { id: payload.id };
}

// ─── Reset-password session JWT ───────────────────────────────────────────────

function signResetTempToken(userId: string): string {
  const secret = getJwtSecret();
  return jwt.sign(
    { id: userId, type: 'reset_session' },
    secret,
    { expiresIn: `${OTP_TEMP_TOKEN_MINUTES}m` } as jwt.SignOptions
  );
}

export function verifyResetToken(token: string): { id: string } {
  const secret = getJwtSecret();
  let payload: { id: string; type: string };
  try {
    payload = jwt.verify(token, secret) as { id: string; type: string };
  } catch {
    throw httpError('Reset link has expired. Please request a new one.', 401);
  }
  if (payload.type !== 'reset_session' && payload.type !== 'password_reset') {
    throw httpError('Invalid reset token', 401);
  }
  return { id: payload.id };
}

// Signs a short-lived token that authorises only the final password change step
export function signPasswordResetToken(userId: string): string {
  const secret = getJwtSecret();
  return jwt.sign(
    { id: userId, type: 'password_reset' },
    secret,
    { expiresIn: '10m' } as jwt.SignOptions
  );
}

// ─── Create reset-password OTP session ────────────────────────────────────────

/**
 * Looks up a user by email and, if found, generates a 6-digit OTP, stores
 * its bcrypt hash + expiry, sends the same branded digit-box email, and
 * returns a reset_session JWT.
 *
 * Always resolves successfully (never reveals whether the email is registered).
 */
export async function createResetSession(email: string): Promise<string | null> {
  const normalised = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalised });

  // Security: silently succeed even if user not found (no enumeration)
  if (!user) return null;

  const code = generateOtpCode();
  console.log(`\n[RESET] 🔑 Reset code for ${user.name} (${user.email}): ${code}\n`);
  const hash = await bcrypt.hash(code, 8);
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const tempToken = signResetTempToken(String(user._id));

  user.otpHash = hash;
  user.otpExpiry = expiry;
  user.otpTempToken = tempToken;
  await user.save();

  const recipientEmail = user.email || user.username;
  try {
    const fromName = process.env.SMTP_FROM_NAME || 'MensFlow';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@mensflow.app';
    const transporter = await getTransporter();

    const fromField = fromEmail.includes('<') && fromEmail.includes('>') ? fromEmail : `"${fromName}" <${fromEmail}>`;
    const info = await withRetry(() => transporter.sendMail({
      from: fromField,
      to: `"${user.name}" <${recipientEmail}>`,
      subject: 'MensFlow — Reset your password',
      html: buildOtpEmailHtml(user.name, code, OTP_EXPIRY_MINUTES),
      text: `Your MensFlow password reset code: ${code}\n\nExpires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.`,
    }), { maxAttempts: 3, baseDelayMs: 1_000 });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[RESET] Preview reset email at: ${previewUrl}`);
    }
  } catch (emailErr) {
    logger.error('[RESET] Failed to send reset email', { error: emailErr instanceof Error ? emailErr.message : String(emailErr) });
  }

  return tempToken;
}

// ─── Create OTP session ───────────────────────────────────────────────────────

/**
 * Generates a 6-digit OTP, stores its bcrypt hash + expiry on the user doc,
 * sends the branded digit-box email to user.email, and returns a temp JWT.
 */
export async function createOtpSession(userId: string): Promise<string> {
  const user = await User.findById(userId);
  if (!user) throw httpError('User not found', 404);

  const code = generateOtpCode();
  console.log(`\n[OTP] 🔑 Code for ${user.name} (${user.email || user.username}): ${code}\n`);
  const hash = await bcrypt.hash(code, 8); // lighter work factor — short-lived code
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const tempToken = signOtpTempToken(String(user._id));

  user.otpHash = hash;
  user.otpExpiry = expiry;
  user.otpTempToken = tempToken;
  await user.save();

  // Send OTP email to the user's registered email address (fallback to username for legacy accounts)
  const recipientEmail = user.email || user.username;
  try {
    const fromName = process.env.SMTP_FROM_NAME || 'MensFlow';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@mensflow.app';
    const transporter = await getTransporter();

    const fromField = fromEmail.includes('<') && fromEmail.includes('>') ? fromEmail : `"${fromName}" <${fromEmail}>`;
    const info = await withRetry(() => transporter.sendMail({
      from: fromField,
      to: `"${user.name}" <${recipientEmail}>`,
      subject: 'MensFlow — Your verification code',
      html: buildOtpEmailHtml(user.name, code, OTP_EXPIRY_MINUTES),
      text: `Your MensFlow verification code: ${code}\n\nExpires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.`,
    }), { maxAttempts: 3, baseDelayMs: 1_000 });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[OTP] Preview your code at: ${previewUrl}`);
    }
  } catch (emailErr) {
    logger.error('[OTP] Failed to send OTP email', { error: emailErr instanceof Error ? emailErr.message : String(emailErr) });
  }

  return tempToken;
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

/**
 * Validates the 6-digit code against the stored bcrypt hash.
 * Clears OTP fields on success and returns the user document.
 */
export async function verifyOtpCode(tempToken: string, code: string): Promise<InstanceType<typeof User>> {
  let userId: string;
  try {
    ({ id: userId } = verifyOtpTempToken(tempToken));
  } catch {
    throw httpError('Your verification session has expired. Please sign in again.', 401);
  }

  const user = await User.findById(userId);
  if (!user) throw httpError('User not found', 404);

  if (!user.otpHash || !user.otpExpiry) {
    throw httpError('No pending verification found. Please sign in again.', 400);
  }

  if (new Date() > user.otpExpiry) {
    user.otpHash = null;
    user.otpExpiry = null;
    user.otpTempToken = null;
    await user.save();
    throw httpError('Verification code has expired. Please sign in again.', 400);
  }

  const isMatch = await bcrypt.compare(code.trim(), user.otpHash);
  if (!isMatch) {
    throw httpError('Incorrect verification code. Please check your email and try again.', 400);
  }

  // Clear OTP fields
  user.otpHash = null;
  user.otpExpiry = null;
  user.otpTempToken = null;
  await user.save();

  return user;
}
