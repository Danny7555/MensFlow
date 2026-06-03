import { toast } from 'sonner'
import { post } from './apiClient'

/**
 * Sends a reminder email via the backend Nodemailer service.
 * Requires the user to be authenticated.
 */
export async function sendEmailReminder(
  toEmail: string,
  toName: string,
  reminderTitle: string,
  reminderMessage: string
): Promise<boolean> {
  try {
    const result = await post<{ success: boolean; previewUrl?: string | null }>('/email/send', {
      toEmail,
      toName,
      reminderTitle,
      reminderMessage,
    })

    // In development, Nodemailer falls back to Ethereal — log the preview link
    if (result.previewUrl) {
      console.info('[Email] Preview your email at:', result.previewUrl)
    }

    toast.success('Email reminder sent!', {
      description: `Delivered to ${toEmail}`,
    })
    return true
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not send email reminder.'
    console.error('[Email] Failed to send reminder:', error)
    toast.error('Failed to send email reminder', { description: msg })
    return false
  }
}
