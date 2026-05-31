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
              <a href="https://mensflow.app" style="display:inline-block;background:linear-gradient(135deg,#e84393,#f472b6);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:50px;letter-spacing:0.02em;">
                Open MensFlow →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f3e4ed;">
              <p style="margin:0;font-size:12px;color:#b09ba8;line-height:1.5;">
                You received this because email reminders are enabled in your MensFlow account.<br/>
                <a href="https://mensflow.app/settings" style="color:#e84393;text-decoration:none;">Manage notification preferences</a>
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

// ─── Main send function ───────────────────────────────────────────────────────

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

  // Fall back to Ethereal test account for development / missing SMTP config
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

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: `"${toName}" <${toEmail}>`,
    subject: `MensFlow: ${reminderTitle}`,
    html,
    text: `${reminderTitle}\n\n${reminderMessage}\n\nOpen MensFlow at https://mensflow.app`,
  });

  // If using Ethereal, generate a preview URL (dev only)
  const rawPreview = nodemailer.getTestMessageUrl(info);
  if (rawPreview) {
    previewUrl = String(rawPreview);
    console.log(`[Email] Preview URL: ${previewUrl}`);
  }

  console.log(`[Email] Message sent: ${info.messageId} → ${toEmail}`);
  return { success: true, previewUrl };
}
