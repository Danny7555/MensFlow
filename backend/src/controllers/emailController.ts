import { Request, Response } from 'express';
import { sendReminderEmail } from '../services/emailService';

export async function sendEmailReminder(req: Request, res: Response): Promise<void> {
  const { toEmail, toName, reminderTitle, reminderMessage } = req.body as {
    toEmail?: string;
    toName?: string;
    reminderTitle?: string;
    reminderMessage?: string;
  };

  if (!toEmail || !toName || !reminderTitle || !reminderMessage) {
    res.status(400).json({ error: 'toEmail, toName, reminderTitle, and reminderMessage are required.' });
    return;
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(toEmail)) {
    res.status(400).json({ error: 'Invalid email address.' });
    return;
  }

  try {
    const result = await sendReminderEmail({ toEmail, toName, reminderTitle, reminderMessage });
    res.status(200).json({
      success: true,
      previewUrl: result.previewUrl ?? null,
    });
  } catch (err: unknown) {
    console.error('[Email Controller] Failed to send email:', err);
    const message = err instanceof Error ? err.message : 'Failed to send email.';
    res.status(500).json({ error: message });
  }
}
