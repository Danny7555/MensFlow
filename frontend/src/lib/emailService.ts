import emailjs from '@emailjs/browser'
import { toast } from 'sonner'

export async function sendEmailReminder(
  toEmail: string,
  toName: string,
  reminderTitle: string,
  reminderMessage: string
): Promise<boolean> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS environment variables are missing. Simulating email transmission.')
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success('Simulation: Email reminder sent successfully!', {
      description: `Sent to ${toEmail} with title "${reminderTitle}"`,
    })
    return true
  }

  try {
    const templateParams = {
      to_name: toName,
      to_email: toEmail,
      subject: `MensFlow Reminder: ${reminderTitle}`,
      reminder_title: reminderTitle,
      reminder_message: reminderMessage,
      from_name: 'MensFlow Reminders'
    }

    const result = await emailjs.send(serviceId, templateId, templateParams, publicKey)
    if (result.status === 200) {
      toast.success('Email reminder sent successfully!', {
        description: `Delivered to ${toEmail}`
      })
      return true
    }
    throw new Error(`EmailJS responded with status: ${result.status}`)
  } catch (error: any) {
    console.error('Failed to send email via EmailJS:', error)
    toast.error('Failed to send email reminder', {
      description: error.message || 'Please check your EmailJS configurations.'
    })
    return false
  }
}
