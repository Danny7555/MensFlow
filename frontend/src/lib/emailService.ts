import { toast } from 'sonner'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

/**
 * Sends a reminder email via the backend Nodemailer service.
 * Requires the user to be authenticated (JWT token stored in localStorage).
 */
export async function sendEmailReminder(
  toEmail: string,
  toName: string,
  reminderTitle: string,
  reminderMessage: string
): Promise<boolean> {
  const token = localStorage.getItem('mensflow_token')

  if (!token) {
    toast.error('You must be logged in to send email reminders.')
    return false
  }

  try {
    const res = await fetch(`${API_BASE}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ toEmail, toName, reminderTitle, reminderMessage }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(json.error || `Server responded with ${res.status}`)
    }

    // In development, Nodemailer falls back to Ethereal — log the preview link
    if (json.previewUrl) {
      console.info('[Email] Preview your email at:', json.previewUrl)
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
