import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { sendEmailReminder } from '../controllers/emailController';

const router = Router();

// All email routes require a valid JWT
router.use(authenticate);

/**
 * POST /api/email/send
 * Body: { toEmail, toName, reminderTitle, reminderMessage }
 * Sends a reminder email via Nodemailer.
 */
router.post('/send', sendEmailReminder);

export default router;
