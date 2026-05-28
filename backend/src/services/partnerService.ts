import { User } from '../models/User';
import { Dashboard } from '../models/Dashboard';
import { PartnerPing, SupportAction, SupportStreak } from '../models/Partner';
import { SymptomLog } from '../models/Symptom';
import { IUser, IPartnerPing, IDashboard } from '../interfaces';

// ─── Pairing ─────────────────────────────────────────────────────────────────

export async function pairWithPartner(
  userId: string,
  partnerCode: string
): Promise<{ id: string; name: string }> {
  const partner = await User.findOne({ partnerCode: partnerCode.toUpperCase() });

  if (!partner) {
    throw Object.assign(new Error('Invalid partner code — partner not found'), { status: 404 });
  }
  if (String(partner._id) === userId) {
    throw Object.assign(new Error('You cannot pair with yourself'), { status: 400 });
  }
  if (partner.partnerId && String(partner.partnerId) !== userId) {
    throw Object.assign(new Error('This partner is already paired with someone else'), { status: 400 });
  }

  await User.findByIdAndUpdate(userId, { partnerId: partner._id });
  await User.findByIdAndUpdate(partner._id, { partnerId: userId });

  return { id: String(partner._id), name: partner.name };
}

export async function disconnectPartner(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (user?.partnerId) {
    await User.findByIdAndUpdate(user.partnerId, { partnerId: null });
  }
  await User.findByIdAndUpdate(userId, { partnerId: null });
}

// ─── Partner Status ──────────────────────────────────────────────────────────

export async function getPartnerStatus(userId: string): Promise<object> {
  const user = await User.findById(userId).lean();
  if (!user?.partnerId) {
    return { paired: false };
  }

  const partner = await User.findById(user.partnerId).lean();
  if (!partner) {
    await User.findByIdAndUpdate(userId, { partnerId: null });
    return { paired: false };
  }

  const partnerDash = await Dashboard.findOne({ userId: partner._id }).lean();
  const today = todayString();
  const yesterday = yesterdayString();

  const latestLog = await SymptomLog.findOne({ userId: partner._id, date: today }).lean();
  const symptoms = latestLog?.symptoms ?? [];

  let streakDoc = await SupportStreak.findOne({ userId }).lean();
  if (!streakDoc) {
    await SupportStreak.create({ userId });
    streakDoc = { streak: 0, lastActionDate: '' } as any;
  }

  let currentStreak = streakDoc!.streak;
  if (streakDoc!.lastActionDate && streakDoc!.lastActionDate !== today && streakDoc!.lastActionDate !== yesterday) {
    await SupportStreak.findOneAndUpdate({ userId }, { streak: 0 });
    currentStreak = 0;
  }

  const completedToday = await SupportAction.find({ userId, completedAt: today })
    .distinct('actionId')
    .lean();

  return {
    paired: true,
    partner: {
      name: partner.name,
      avatar: partner.avatar,
      accessLevel: partner.accessLevel,
    },
    cycle: partnerDash
      ? {
          lastPeriodStart: partnerDash.lastPeriodStart,
          typicalCycleDays: partnerDash.typicalCycleDays,
          phaseLabel: partnerDash.phaseLabel,
          hormoneTrend: partnerDash.hormoneTrend,
          bodySignals: partnerDash.bodySignals,
          cycleVariationDays: partnerDash.cycleVariationDays,
          isAtypical: partnerDash.isAtypical,
          symptoms,
        }
      : null,
    support: {
      completedActions: completedToday,
      supportStreak: currentStreak,
      lastActionDate: streakDoc!.lastActionDate,
    },
  };
}

// ─── Pings ───────────────────────────────────────────────────────────────────

export async function sendPing(
  senderId: string,
  pingId: string,
  label: string,
  message: string
): Promise<IPartnerPing> {
  const sender = await User.findById(senderId).lean();
  if (!sender?.partnerId) {
    throw Object.assign(new Error('You must pair with a partner before sending a ping'), { status: 400 });
  }

  const timestamp = Date.now();
  await PartnerPing.create({
    senderId,
    receiverId: sender.partnerId,
    pingId,
    label,
    message,
    timestamp,
  });

  return { senderId, receiverId: String(sender.partnerId), pingId, label, message, timestamp };
}

export async function getLatestPing(userId: string): Promise<IPartnerPing | null> {
  const ping = await PartnerPing.findOne({ receiverId: userId })
    .sort({ timestamp: -1 })
    .lean();

  if (!ping) return null;

  return {
    senderId: String(ping.senderId),
    receiverId: String(ping.receiverId),
    pingId: ping.pingId,
    label: ping.label,
    message: ping.message,
    timestamp: ping.timestamp,
  };
}

// ─── Support Actions ─────────────────────────────────────────────────────────

export async function toggleSupportAction(
  userId: string,
  actionId: string
): Promise<{ completedActions: string[]; supportStreak: number; lastActionDate: string }> {
  const today = todayString();
  const yesterday = yesterdayString();

  const existing = await SupportAction.findOne({ userId, actionId, completedAt: today });

  let actionAdded: boolean;
  if (existing) {
    await existing.deleteOne();
    actionAdded = false;
  } else {
    await SupportAction.create({ userId, actionId, completedAt: today });
    actionAdded = true;
  }

  let streakDoc = await SupportStreak.findOne({ userId });
  if (!streakDoc) {
    streakDoc = await SupportStreak.create({ userId });
  }

  const todayActions = await SupportAction.find({ userId, completedAt: today }).distinct('actionId');
  const count = todayActions.length;

  let newStreak = streakDoc.streak;
  let newLastDate = streakDoc.lastActionDate;

  if (actionAdded && count === 1) {
    newStreak = streakDoc.lastActionDate === yesterday ? streakDoc.streak + 1 : 1;
    newLastDate = today;
  } else if (!actionAdded && count === 0) {
    const lastAction = await SupportAction.findOne({ userId }).sort({ completedAt: -1 }).lean();
    if (lastAction) {
      newLastDate = lastAction.completedAt;
      newStreak = lastAction.completedAt === yesterday ? streakDoc.streak : 1;
    } else {
      newStreak = 0;
      newLastDate = '';
    }
  }

  await SupportStreak.findOneAndUpdate({ userId }, { streak: newStreak, lastActionDate: newLastDate });

  return {
    completedActions: todayActions,
    supportStreak: newStreak,
    lastActionDate: newLastDate,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
