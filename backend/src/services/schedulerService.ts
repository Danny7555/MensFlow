import cron from 'node-cron';
import { User } from '../models/User';
import { Dashboard } from '../models/Dashboard';
import { Settings } from '../models/Settings';
import { SymptomLog } from '../models/Symptom';
import { sendReminderEmail } from './emailService';

// ─── Cycle calculation (mirrors frontend cycleUtils.ts) ──────────────────────

function computeCycleDay(lastPeriodStart: string, cycleLen: number): number {
  const safeLen = Math.max(1, cycleLen || 28);
  const start = new Date(`${lastPeriodStart}T12:00:00`);
  if (Number.isNaN(start.getTime())) return 1;
  const days = Math.floor((Date.now() - start.getTime()) / 86400000);
  const m = ((days % safeLen) + safeLen) % safeLen;
  return m + 1;
}

function daysUntilNextPeriod(cycleDay: number, cycleLen: number): number {
  return Math.max(0, cycleLen - cycleDay);
}

function ovulationDay(cycleLen: number): number {
  return Math.max(10, cycleLen - 14);
}

// ─── Per-user reminder logic ──────────────────────────────────────────────────

interface ReminderEvent {
  title: string;
  message: string;
  type: 'period_soon' | 'ovulation' | 'daily_log';
}

function buildReminderEvents(
  cycleDay: number,
  cycleLen: number,
  name: string,
  todayLogged: boolean,
  isPartner: boolean
): ReminderEvent[] {
  const events: ReminderEvent[] = [];
  const daysLeft = daysUntilNextPeriod(cycleDay, cycleLen);
  const ovDay = ovulationDay(cycleLen);
  const fertileStart = ovDay - 4;
  const fertileEnd = ovDay + 2;

  // ── Period approaching (3-day, 2-day, 1-day warnings) ────────────────────
  if (daysLeft <= 3 && daysLeft > 0) {
    if (isPartner) {
      events.push({
        title: `Her period is starting in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        message: `Based on her cycle tracking, her next period is expected in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Stock up on comfort snacks, heating pads, and plan a cosy night in.`,
        type: 'period_soon',
      });
    } else {
      events.push({
        title: `Your period is ${daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}`,
        message: `Based on your cycle history, your next period is expected in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (Day ${cycleDay} of ${cycleLen}). Stock up on supplies and prioritise rest.`,
        type: 'period_soon',
      });
    }
  }

  // ── Ovulation / Fertile window ────────────────────────────────────────────
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
    const atPeak = cycleDay === ovDay;
    if (isPartner) {
      events.push({
        title: atPeak ? `Her ovulation day — peak energy!` : `She is in her fertile window`,
        message: atPeak
          ? `Today is her predicted ovulation day (Day ${cycleDay}). She is likely feeling confident and social — a great day for quality time together.`
          : `She is currently in her fertile window (Day ${cycleDay} of ${cycleLen}). Estrogen is peaking — expect higher energy and social confidence.`,
        type: 'ovulation',
      });
    } else {
      events.push({
        title: atPeak ? `Today is your ovulation day!` : `You are in your fertile window`,
        message: atPeak
          ? `Today is your predicted ovulation day (Day ${cycleDay}). Estrogen is at its peak — expect high energy, confidence, and social drive.`
          : `You are currently in your fertile window (Day ${cycleDay} of ${cycleLen}). Your body is at peak hormonal output. Great time for exercise, creativity, and social plans.`,
        type: 'ovulation',
      });
    }
  }

  // ── Daily log nudge (if nothing logged today) ─────────────────────────────
  if (!todayLogged && !isPartner) {
    events.push({
      title: `Daily symptom log reminder`,
      message: `You haven't logged any symptoms today (Cycle Day ${cycleDay}). Tracking daily keeps your period and ovulation predictions accurate.`,
      type: 'daily_log',
    });
  }

  return events;
}

// ─── Core job function ────────────────────────────────────────────────────────

async function runDailyReminderJob(): Promise<void> {
  console.log('[Scheduler] Running daily reminder job…');

  const todayStr = new Date().toISOString().slice(0, 10);

  try {
    // Fetch all lady users who have email notifications enabled
    const users = await User.find({ role: { $in: ['lady', 'partner'] } }).lean();

    let emailsSent = 0;

    for (const user of users) {
      try {
        const settings = await Settings.findOne({ userId: user._id }).lean();
        if (!settings) continue;

        // Skip users who have disabled email notifications
        if (!settings.notificationsEmail || !settings.notificationsCycleReminders) continue;

        // email = username (stored as email in this app)
        const toEmail = user.username;
        const toName = user.name;

        let cycleDay = 1;
        let cycleLen = 28;
        let todayLogged = false;
        const isPartner = user.role === 'partner';

        if (isPartner && user.partnerId) {
          // Get the lady's dashboard
          const partnerDashboard = await Dashboard.findOne({ userId: user.partnerId }).lean();
          if (!partnerDashboard?.lastPeriodStart) continue;
          cycleLen = partnerDashboard.typicalCycleDays || 28;
          cycleDay = computeCycleDay(partnerDashboard.lastPeriodStart, cycleLen);
        } else if (!isPartner) {
          const dashboard = await Dashboard.findOne({ userId: user._id }).lean();
          if (!dashboard?.lastPeriodStart) continue;
          cycleLen = dashboard.typicalCycleDays || 28;
          cycleDay = computeCycleDay(dashboard.lastPeriodStart, cycleLen);

          // Check if user already logged today
          const todayLog = await SymptomLog.findOne({ userId: user._id, date: todayStr }).lean();
          todayLogged = !!todayLog && (todayLog.symptoms?.length ?? 0) > 0;
        }

        const events = buildReminderEvents(cycleDay, cycleLen, toName, todayLogged, isPartner);

        for (const event of events) {
          await sendReminderEmail({
            toEmail,
            toName,
            reminderTitle: event.title,
            reminderMessage: event.message,
          });
          emailsSent++;
        }
      } catch (userErr) {
        console.error(`[Scheduler] Error processing user ${user._id}:`, userErr);
      }
    }

    console.log(`[Scheduler] Daily reminder job complete — ${emailsSent} email(s) sent.`);
  } catch (err) {
    console.error('[Scheduler] Job failed:', err);
  }
}

// ─── Start scheduler ──────────────────────────────────────────────────────────

/**
 * Schedules the daily reminder email job.
 * Runs every day at 8:00 AM (server local time).
 * Pass runImmediately=true in development to test without waiting.
 */
export function startScheduler(runImmediately = false): void {
  // '0 8 * * *'  →  every day at 08:00
  cron.schedule('0 8 * * *', () => {
    runDailyReminderJob().catch((err) =>
      console.error('[Scheduler] Unhandled error in daily job:', err)
    );
  });

  console.log('[Scheduler] Daily email reminder job scheduled at 08:00 every day.');

  if (runImmediately) {
    console.log('[Scheduler] Running job immediately (dev mode)…');
    runDailyReminderJob().catch(console.error);
  }
}
