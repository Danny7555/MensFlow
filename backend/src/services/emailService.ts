import nodemailer from 'nodemailer';

// ─── Transporter ──────────────────────────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true'; // true for port 465

  if (!host || !user || !pass) {
    // Return a test transporter using Ethereal (catches emails locally during dev)
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildEmailHtml(toName: string, reminderTitle: string, reminderMessage: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${reminderTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f8f0f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f0f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(220,80,130,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e84393,#f472b6);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">MensFlow</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.7);margin-left:8px;text-transform:uppercase;letter-spacing:0.15em;">Reminder</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:14px;color:#9b6b86;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Hello, ${toName}</p>
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1a0a14;line-height:1.3;">${reminderTitle}</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#5c3d52;line-height:1.65;">${reminderMessage}</p>
              <a href="https://mens-flow-f7jm.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#e84393,#f472b6);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:50px;letter-spacing:0.02em;">
                Open MensFlow →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f3e4ed;">
              <p style="margin:0;font-size:12px;color:#b09ba8;line-height:1.5;">
                You received this because email reminders are enabled in your MensFlow account.<br/>
                <a href="https://mens-flow-f7jm.vercel.app/settings" style="color:#e84393;text-decoration:none;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Invite email template ────────────────────────────────────────────────────

function buildInviteHtml(inviterName: string, signupLink: string, partnerCode: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${inviterName} invited you to MensFlow</title>
</head>
<body style="margin:0;padding:0;background:#f8f0f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f0f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(220,80,130,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e84393,#f472b6);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">MensFlow</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.7);margin-left:8px;text-transform:uppercase;letter-spacing:0.15em;">Partner Invite</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:14px;color:#9b6b86;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">You've been invited 💌</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a0a14;line-height:1.3;">${inviterName} wants to connect with you on MensFlow</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#5c3d52;line-height:1.65;">
                MensFlow is a cycle tracking app that helps couples stay in sync — understand each other's moods, energy, and needs throughout the month.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#5c3d52;line-height:1.65;">
                Click below to create your free account and instantly pair with ${inviterName}:
              </p>
              <a href="${signupLink}" style="display:inline-block;background:linear-gradient(135deg,#e84393,#f472b6);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:50px;letter-spacing:0.02em;">
                Join MensFlow →
              </a>
              <p style="margin:28px 0 0;font-size:13px;color:#9b6b86;line-height:1.5;">
                Or enter this partner code manually after signing up:<br/>
                <strong style="font-size:18px;color:#e84393;letter-spacing:0.1em;">${partnerCode}</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f3e4ed;">
              <p style="margin:0;font-size:12px;color:#b09ba8;line-height:1.5;">
                You received this because someone used your email to invite you to MensFlow.<br/>
                If this wasn't intended for you, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export interface SendInviteEmailOptions {
  toEmail: string;
  inviterName: string;
  signupLink: string;
  partnerCode: string;
}

export async function sendInviteEmail(opts: SendInviteEmailOptions): Promise<{ success: boolean; previewUrl?: string }> {
  const { toEmail, inviterName, signupLink, partnerCode } = opts;

  const fromName = process.env.SMTP_FROM_NAME || 'MensFlow';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@mensflow.app';
  const html = buildInviteHtml(inviterName, signupLink, partnerCode);

  let transporter = createTransporter();

  let previewUrl: string | undefined;
  if (!transporter) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const fromField = fromEmail.includes('<') && fromEmail.includes('>') ? fromEmail : `"${fromName}" <${fromEmail}>`;
  const info = await transporter.sendMail({
    from: fromField,
    to: toEmail,
    subject: `${inviterName} invited you to MensFlow`,
    html,
    text: `${inviterName} has invited you to MensFlow.\n\nCreate your account and pair instantly:\n${signupLink}\n\nOr use partner code: ${partnerCode}`,
  });

  const rawPreview = nodemailer.getTestMessageUrl(info);
  if (rawPreview) {
    previewUrl = String(rawPreview);
    console.log(`[Email] Invite preview URL: ${previewUrl}`);
  }

  console.log(`[Email] Invite sent: ${info.messageId} → ${toEmail}`);
  return { success: true, previewUrl };
}

// ─── Reminder email (used by scheduler) ──────────────────────────────────────

export interface SendEmailOptions {
  toEmail: string;
  toName: string;
  reminderTitle: string;
  reminderMessage: string;
}

export async function sendReminderEmail(opts: SendEmailOptions): Promise<{ success: boolean; previewUrl?: string }> {
  const { toEmail, toName, reminderTitle, reminderMessage } = opts;

  const fromName = process.env.SMTP_FROM_NAME || 'MensFlow';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@mensflow.app';
  const html = buildEmailHtml(toName, reminderTitle, reminderMessage);

  let transporter = createTransporter();

  let previewUrl: string | undefined;
  if (!transporter) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const fromField = fromEmail.includes('<') && fromEmail.includes('>') ? fromEmail : `"${fromName}" <${fromEmail}>`;
  const info = await transporter.sendMail({
    from: fromField,
    to: `"${toName}" <${toEmail}>`,
    subject: `MensFlow: ${reminderTitle}`,
    html,
    text: `${reminderTitle}\n\n${reminderMessage}\n\nOpen MensFlow at https://mens-flow-f7jm.vercel.app`,
  });

  const rawPreview = nodemailer.getTestMessageUrl(info);
  if (rawPreview) {
    previewUrl = String(rawPreview);
    console.log(`[Email] Preview URL: ${previewUrl}`);
  }

  console.log(`[Email] Message sent: ${info.messageId} → ${toEmail}`);
  return { success: true, previewUrl };
}

// ─── Guardian Notification Email ─────────────────────────────────────────────

function buildGuardianEmailHtml(userName: string, guardianEmail: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Guardian Supervision Enabled</title>
</head>
<body style="margin:0;padding:0;background:#f8f0f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f0f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(220,80,130,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e84393,#f472b6);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">MensFlow</span>
                    <span style="font-size:11px;color:rgba(255,255,255,0.7);margin-left:8px;text-transform:uppercase;letter-spacing:0.15em;">Parental Controls</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:14px;color:#9b6b86;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Supervision Alert 🛡️</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a0a14;line-height:1.3;">Guardian Supervision Enabled</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#5c3d52;line-height:1.65;">
                Hello,
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#5c3d52;line-height:1.65;">
                This email address (<strong>${guardianEmail}</strong>) has been designated as the contact for supervision and account recovery for <strong>${userName}</strong>'s MensFlow account.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#5c3d52;line-height:1.65;">
                As the registered guardian, this address will be used to authorize changes to parental control settings and assist in account access recovery.
              </p>
              <p style="margin:0;font-size:13px;color:#9b6b86;line-height:1.5;">
                If you did not authorize this setup, or if you believe this was configured by mistake, please contact our support team immediately at <a href="mailto:support@mensflow.app" style="color:#e84393;text-decoration:none;font-weight:600;">support@mensflow.app</a>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f3e4ed;">
              <p style="margin:0;font-size:12px;color:#b09ba8;line-height:1.5;">
                You received this because your email address was set as a Guardian contact in the MensFlow application settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export interface SendGuardianEmailOptions {
  toEmail: string;
  userName: string;
}

export async function sendGuardianEmail(opts: SendGuardianEmailOptions): Promise<{ success: boolean; previewUrl?: string }> {
  const { toEmail, userName } = opts;

  const fromName = process.env.SMTP_FROM_NAME || 'MensFlow';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@mensflow.app';
  const html = buildGuardianEmailHtml(userName, toEmail);

  let transporter = createTransporter();

  let previewUrl: string | undefined;
  if (!transporter) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const fromField = fromEmail.includes('<') && fromEmail.includes('>') ? fromEmail : `"${fromName}" <${fromEmail}>`;
  const info = await transporter.sendMail({
    from: fromField,
    to: toEmail,
    subject: `MensFlow: Guardian Supervision Enabled`,
    html,
    text: `Guardian Supervision Enabled\n\nHello,\n\nThis email address (${toEmail}) has been set as the contact for supervision and account recovery for ${userName}'s MensFlow account.\n\nIf you did not authorize this, please contact support@mensflow.app immediately.`,
  });

  const rawPreview = nodemailer.getTestMessageUrl(info);
  if (rawPreview) {
    previewUrl = String(rawPreview);
    console.log(`[Email] Guardian preview URL: ${previewUrl}`);
  }

  console.log(`[Email] Guardian alert sent: ${info.messageId} → ${toEmail}`);
  return { success: true, previewUrl };
}
