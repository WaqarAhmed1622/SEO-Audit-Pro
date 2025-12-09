import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

// Only initialize Resend if API key is configured
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'SEO Audit <noreply@seoaudit.com>';
const APP_NAME = process.env.APP_NAME || 'SEO Audit';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    if (!resend) {
      logger.warn('Resend API key not configured, skipping email send');
      logger.info(`Would send email to ${options.to}: ${options.subject}`);
      return true;
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
};

// ============================================
// EMAIL TEMPLATES
// ============================================

export const sendWelcomeEmail = async (to: string, name: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${APP_NAME}! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thanks for signing up! You're now ready to create professional SEO audits in seconds.</p>
          <p>Here's what you can do:</p>
          <ul>
            <li>Generate comprehensive SEO audits</li>
            <li>Create white-labeled PDF reports</li>
            <li>Manage your agency clients</li>
            <li>Embed audit widgets on your website</li>
          </ul>
          <a href="${FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
          <p>Need help? Just reply to this email!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}! 🚀`,
    html,
  });
};

export const sendVerificationEmail = async (to: string, name: string, token: string) => {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" class="button">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Verify your email - ${APP_NAME}`,
    html,
  });
};

export const sendPasswordResetEmail = async (to: string, name: string, token: string) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #EF4444, #B91C1C); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email. Your password won't be changed.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Reset your password - ${APP_NAME}`,
    html,
  });
};

export const sendTeamInviteEmail = async (
  to: string,
  inviterName: string,
  orgName: string,
  token: string
) => {
  const inviteUrl = `${FRONTEND_URL}/invite?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6, #6D28D9); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited! 🎉</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on ${APP_NAME}.</p>
          <p>Click the button below to accept the invitation:</p>
          <a href="${inviteUrl}" class="button">Accept Invitation</a>
          <p>This invitation will expire in 7 days.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `${inviterName} invited you to ${orgName} - ${APP_NAME}`,
    html,
  });
};

export const sendClientPortalInvite = async (
  to: string,
  clientName: string,
  agencyName: string,
  portalUrl: string,
  tempPassword: string
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .credentials { background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your SEO Reports Portal</h1>
        </div>
        <div class="content">
          <p>Hi ${clientName},</p>
          <p><strong>${agencyName}</strong> has set up a client portal for you to access your SEO audit reports.</p>
          <div class="credentials">
            <p><strong>Portal URL:</strong> ${portalUrl}</p>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <a href="${portalUrl}" class="button">Access Your Portal</a>
          <p>Please change your password after your first login.</p>
        </div>
        <div class="footer">
          <p>Powered by ${APP_NAME}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Your SEO Reports Portal from ${agencyName}`,
    html,
  });
};

export const sendAuditCompleteEmail = async (
  to: string,
  name: string,
  url: string,
  score: number,
  pdfUrl: string
) => {
  const scoreColor = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .score { font-size: 48px; font-weight: bold; color: ${scoreColor}; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your SEO Audit is Ready! 📊</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Great news! Your SEO audit for <strong>${url}</strong> is complete.</p>
          <div class="score">${score}/100</div>
          <p style="text-align: center;">
            <a href="${pdfUrl}" class="button">Download PDF Report</a>
            <a href="${FRONTEND_URL}/dashboard/audits" class="button" style="background: #6B7280;">View in Dashboard</a>
          </p>
          <p>Your report includes actionable recommendations to improve your SEO score.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Your SEO Audit is Ready - Score: ${score}/100`,
    html,
  });
};

export const sendPaymentReceiptEmail = async (
  to: string,
  name: string,
  amount: number,
  planName: string,
  invoiceUrl?: string
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .receipt { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #10B981; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Received ✓</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for your payment! Here's your receipt:</p>
          <div class="receipt">
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Amount:</strong> <span class="amount">$${(amount / 100).toFixed(2)}</span></p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          ${invoiceUrl ? `<a href="${invoiceUrl}" class="button">View Invoice</a>` : ''}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Payment Receipt - ${APP_NAME}`,
    html,
  });
};

export const sendPaymentFailedEmail = async (to: string, name: string, planName: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #EF4444, #B91C1C); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Failed ⚠️</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We couldn't process your payment for the <strong>${planName}</strong> plan.</p>
          <p>Please update your payment method to continue using ${APP_NAME} without interruption.</p>
          <a href="${FRONTEND_URL}/dashboard/billing" class="button">Update Payment Method</a>
          <p>If you need help, just reply to this email!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Action Required: Payment Failed - ${APP_NAME}`,
    html,
  });
};
