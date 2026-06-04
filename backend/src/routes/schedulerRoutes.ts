import { Router, Request, Response, NextFunction } from 'express';
import { runDailyReminderJob } from '../services/schedulerService';

const router = Router();

/**
 * GET /api/scheduler/cron
 * Secured using Authorization: Bearer <CRON_SECRET> header.
 * Triggers the daily cycle email reminder cron job on Vercel.
 */
router.get('/cron', async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Scheduler Webhook] Unauthorized attempt to trigger cron job');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    await runDailyReminderJob();
    res.json({ success: true, message: 'Daily reminder job executed successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
