import { User } from '../models/User';
import { Dashboard } from '../models/Dashboard';
import { PartnerPing, SupportAction, SupportStreak, PartnerChatMessage } from '../models/Partner';
import { SymptomLog, CustomSymptom } from '../models/Symptom';
import { Settings } from '../models/Settings';
import { IPartnerPing, IPartnerChatMessage } from '../interfaces';
import { httpError } from '../utils/http';
import { generateUniquePartnerCode } from './authService';
import { sendInviteEmail, sendReminderEmail } from './emailService';
import { buildCycleModel } from '../utils/cycleModel';


// ─── Pairing ─────────────────────────────────────────────────────────────────

export async function pairWithPartner(
  userId: string,
  partnerCode: string
): Promise<{ id: string; name: string }> {
  const user = await User.findById(userId);
  if (!user) throw httpError('User not found', 404);

  const partner = await User.findOne({ partnerCode: partnerCode.toUpperCase() });

  if (!partner) {
    throw httpError('Invalid code — no account found with that code', 404);
  }
  if (String(partner._id) === userId) {
    throw httpError('You cannot pair with yourself', 400);
  }
  if (partner.partnerId && String(partner.partnerId) !== userId) {
    throw httpError('This partner is already paired with someone else', 400);
  }

  // Role compatibility check: must be opposite roles (lady ↔ partner)
  if (user.role === partner.role) {
    if (user.role === 'lady') {
      throw httpError('This code belongs to another lady. Only a partner account can connect using your code.', 400);
    } else {
      throw httpError('This code belongs to another partner account. Ask your partner (lady) to share her code instead.', 400);
    }
  }

  await Promise.all([
    User.findByIdAndUpdate(userId, { partnerId: partner._id }),
    User.findByIdAndUpdate(partner._id, { partnerId: userId }),
  ]);

  return { id: String(partner._id), name: partner.name };
}

export async function invitePartner(
  userId: string,
  emailOrUsername: string
): Promise<{ id?: string; name?: string; alreadyPaired: boolean; partnerFound: boolean; emailSent?: boolean }> {
  const normalized = emailOrUsername.toLowerCase().trim();

  // Look up by email OR username so both work
  const partner = await User.findOne({
    $or: [{ email: normalized }, { username: normalized }],
  });

  if (!partner) {
    // No existing account — send an invite email if the input looks like an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    if (!isEmail) {
      // Username that doesn't exist — just tell the frontend no match found
      return { alreadyPaired: false, partnerFound: false, emailSent: false };
    }

    const invitingUser = await User.findById(userId).lean();
    const inviterName = invitingUser?.name || 'Your partner';
    const partnerCode = invitingUser?.partnerCode || '';
    const appUrl = process.env.APP_URL || 'https://mensflow.app';
    const signupLink = `${appUrl}/sync?code=${partnerCode}`;

    try {
      await sendInviteEmail({
        toEmail: normalized,
        inviterName,
        signupLink,
        partnerCode,
      });
    } catch (err) {
      console.error('[invitePartner] Failed to send invite email:', err);
      // Don't throw — the invite is still valid even if email fails
    }

    return { alreadyPaired: false, partnerFound: false, emailSent: true };
  }

  if (String(partner._id) === userId) {
    throw httpError('You cannot pair with yourself', 400);
  }

  if (partner.partnerId && String(partner.partnerId) !== userId) {
    throw httpError('This partner is already paired with someone else', 400);
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    throw httpError('User not found', 404);
  }
  if (user.role === partner.role) {
    throw httpError('Partner accounts must connect to lady accounts, and lady accounts must connect to partner accounts.', 400);
  }

  await Promise.all([
    User.findByIdAndUpdate(userId, { partnerId: partner._id }),
    User.findByIdAndUpdate(partner._id, { partnerId: userId }),
  ]);

  return {
    id: String(partner._id),
    name: partner.name,
    alreadyPaired: false,
    partnerFound: true,
    emailSent: false,
  };
}

export async function disconnectPartner(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const partnerId = user.partnerId;

  // Generate a new code for the disconnecting user
  const newCodeForUser = await generateUniquePartnerCode();
  await User.findByIdAndUpdate(userId, { 
    partnerId: null,
    partnerCode: newCodeForUser
  });

  // If there was a partner, disconnect them and regenerate their code too
  if (partnerId) {
    const newCodeForPartner = await generateUniquePartnerCode();
    await User.findByIdAndUpdate(partnerId, { 
      partnerId: null,
      partnerCode: newCodeForPartner
    });
  }
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

  const partnerUserId = user.role === 'partner' ? userId : String(partner._id);
  const ladyUserId = user.role === 'lady' ? userId : String(partner._id);

  const today = todayString();
  const yesterday = yesterdayString();

  const [
    partnerDash,
    latestLog,
    partnerSettings,
    initialStreakDoc,
    completedToday,
    partnerLastPing,
    partnerLastLog,
    partnerLastMessage,
  ] = await Promise.all([
    Dashboard.findOne({ userId: partner._id }).lean(),
    SymptomLog.findOne({ userId: partner._id, date: today }).lean(),
    Settings.findOne({ userId: partner._id }).lean(),
    SupportStreak.findOne({ userId: partnerUserId }).lean(),
    SupportAction.find({ userId: partnerUserId, completedAt: today }).distinct('actionId'),
    PartnerPing.findOne({ senderId: partner._id, receiverId: userId }).sort({ timestamp: -1 }).lean(),
    SymptomLog.findOne({ userId: partner._id }).sort({ date: -1 }).lean(),
    PartnerChatMessage.findOne({ senderId: partner._id, receiverId: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const symptoms = latestLog?.symptoms ?? [];
  const shareDetails = partnerSettings ? partnerSettings.privacyShareCycleDetails === true : false;
  const shareSymptoms = partnerSettings ? partnerSettings.privacyShareSymptomLogs === true : false;
  const shareCharts = partnerSettings ? partnerSettings.privacyShareHealthCharts === true : false;
  const requestedFields = partnerSettings?.privacyRequestedFields ?? [];

  let lhPeakDay: number | null = null;
  let eggWhiteMucusDay: number | null = null;

  if (partnerDash?.lastPeriodStart) {
    const cycleLogs = await SymptomLog.find({
      userId: partner._id,
      date: { $gte: partnerDash.lastPeriodStart }
    }).lean();

    const start = new Date(partnerDash.lastPeriodStart + 'T12:00:00');
    for (const log of cycleLogs) {
      const logDate = new Date(log.date + 'T12:00:00');
      const day = Math.round((logDate.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      if (log.lhLevel === 'positive') {
        if (lhPeakDay === null || day < lhPeakDay) lhPeakDay = day;
      }
      if (log.mucus === 'egg-white') {
        if (eggWhiteMucusDay === null || day < eggWhiteMucusDay) eggWhiteMucusDay = day;
      }
    }
  }

  const cycleModel = buildCycleModel({
    lastPeriodStart: partnerDash?.lastPeriodStart,
    typicalCycleDays: partnerDash?.typicalCycleDays,
    cycleVariationDays: partnerDash?.cycleVariationDays,
    symptoms,
    lhPeakDay,
    eggWhiteMucusDay,
  });

  let streakDoc = initialStreakDoc;
  if (!streakDoc) {
    await SupportStreak.create({ userId: partnerUserId });
    streakDoc = { streak: 0, lastActionDate: '' } as any;
  }

  let currentStreak = streakDoc!.streak;
  if (streakDoc!.lastActionDate && streakDoc!.lastActionDate !== today && streakDoc!.lastActionDate !== yesterday) {
    await SupportStreak.findOneAndUpdate({ userId: partnerUserId }, { streak: 0 });
    currentStreak = 0;
  }

  // Derive partner's last active time from their most recent ping, log, or message.
  let partnerLastActive: number | null = null;
  if (partnerLastPing?.timestamp) {
    partnerLastActive = Math.max(partnerLastActive ?? 0, partnerLastPing.timestamp);
  }
  if (partnerLastLog?.date) {
    const logTs = new Date(partnerLastLog.date + 'T23:59:59').getTime();
    if (!partnerLastActive || logTs > partnerLastActive) {
      partnerLastActive = logTs;
    }
  }
  if (partnerLastMessage?.createdAt && (!partnerLastActive || partnerLastMessage.createdAt > partnerLastActive)) {
    partnerLastActive = partnerLastMessage.createdAt;
  }

  const ladyDash = user.role === 'lady'
    ? await Dashboard.findOne({ userId }).lean()
    : partnerDash;
  const cycleStart = ladyDash?.lastPeriodStart;
  let totalActionsThisCycle = 0;
  if (cycleStart) {
    totalActionsThisCycle = await SupportAction.countDocuments({
      userId: partnerUserId,
      completedAt: { $gte: cycleStart }
    });
  }

  return {
    paired: true,
    partner: {
      name: partner.name,
      avatar: partner.avatar,
      accessLevel: partner.accessLevel,
      lastActive: partnerLastActive,
    },
    privacyShareCycleDetails: shareDetails,
    privacyShareSymptomLogs: shareSymptoms,
    privacyShareHealthCharts: shareCharts,
    privacyRequestedFields: requestedFields,
    cycle: partnerDash
      ? shareDetails
        ? {
            lastPeriodStart: partnerDash.lastPeriodStart,
            typicalCycleDays: partnerDash.typicalCycleDays,
            phaseLabel: cycleModel.phaseLabel,
            hormoneTrend: cycleModel.hormoneTrend,
            bodySignals: cycleModel.bodySignals,
            guidanceLines: partnerDash.guidanceLines?.length ? partnerDash.guidanceLines : cycleModel.guidanceLines,
            cycleVariationDays: cycleModel.cycleVariationDays,
            isAtypical: cycleModel.isAtypical,
            // Redact symptom-level data if shareSymptoms is off
            symptoms: shareSymptoms ? symptoms : [],
            water: shareSymptoms && latestLog?.water !== undefined ? latestLog.water : 1000,
            weight: shareSymptoms && latestLog?.weight !== undefined ? latestLog.weight : 62.5,
            lhLevel: shareSymptoms && latestLog?.lhLevel !== undefined ? latestLog.lhLevel : null,
            mucus: shareSymptoms && latestLog?.mucus !== undefined ? latestLog.mucus : null,
            scientificInsight: partnerDash.scientificInsight || '',
            dailyTip: partnerDash.dailyTip || { title: '', desc: '' },
          }
        : {
            lastPeriodStart: '', // Redacted
            typicalCycleDays: 28, // Default fallback
            phaseLabel: cycleModel.phaseLabel, // Shared phase for translator/checklist
            hormoneTrend: 'Private details', // Redacted
            bodySignals: 'Private details', // Redacted
            cycleVariationDays: 28, // Redacted
            isAtypical: false, // Redacted
            symptoms: [], // Redacted
            water: 1000, // Redacted
            weight: 62.5, // Redacted
            lhLevel: null, // Redacted
            mucus: null, // Redacted
            scientificInsight: 'Detailed insight kept private by your partner.', // Redacted
            dailyTip: { title: 'Empathy Mode Active', desc: 'Focus on supportive gestures and empathy translator tips below!' },
          }
      : null,
    support: {
      completedActions: completedToday,
      supportStreak: currentStreak,
      lastActionDate: streakDoc!.lastActionDate,
      totalActionsThisCycle,
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
    throw httpError('You must pair with a partner before sending a ping', 400);
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
  const ping = await PartnerPing.findOne({ 
    receiverId: userId,
    message: { $exists: true, $ne: '' },
    label: { $exists: true, $ne: '' }
  })
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

export async function requestDetailedAccess(
  userId: string,
  requestedFields: string[] = ['symptoms', 'insights', 'tracker', 'calendar']
): Promise<{ alreadyPending: boolean; emailQueued: boolean }> {
  const user = await User.findById(userId).lean();
  if (!user?.partnerId) {
    throw httpError('You must pair with a partner before requesting detailed access', 400);
  }
  if (user.role !== 'partner') {
    throw httpError('Only partner accounts can request detailed cycle access', 400);
  }

  const [recipient, previousSettings] = await Promise.all([
    User.findById(user.partnerId).lean(),
    Settings.findOne({ userId: user.partnerId }).lean(),
  ]);
  if (!recipient) {
    throw httpError('Paired partner account not found', 404);
  }

  const alreadyPending = previousSettings?.privacyPendingAccessRequest === true;
  const normalizedFields = normalizeRequestedAccessFields(requestedFields);

  // Build human-readable list of what is being requested
  const fieldLabels: Record<string, string> = {
    symptoms: 'Symptoms',
    insights: 'Health insights',
    tracker: 'Tracker',
    calendar: 'Calendar',
  };
  const requestedLabels = normalizedFields.map((f) => fieldLabels[f] || f).join(', ');

  await Settings.findOneAndUpdate(
    { userId: user.partnerId },
    {
      $set: {
        privacyPendingAccessRequest: true,
        privacyRequestedFields: normalizedFields,
      },
      $setOnInsert: { userId: user.partnerId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (alreadyPending) {
    return { alreadyPending: true, emailQueued: false };
  }

  const partnerName = user.name || 'Your partner';
  await sendPing(
    userId,
    'access-request-ping',
    'Access Request',
    `${partnerName} is requesting access to: ${requestedLabels}.`
  );

  const emailQueued = Boolean(recipient.email && previousSettings?.notificationsEmail);
  if (emailQueued && recipient.email) {
    void sendReminderEmail({
      toEmail: recipient.email,
      toName: recipient.name,
      reminderTitle: 'Detailed cycle access requested',
      reminderMessage: `${partnerName} is requesting access to: ${requestedLabels}. Open MensFlow Notifications to approve or decline.`,
    }).catch((err) => console.error('[requestDetailedAccess] Failed to send access request email:', err));
  }

  return { alreadyPending: false, emailQueued };
}

function normalizeRequestedAccessFields(fields: string[]): string[] {
  const mapped = fields.flatMap((field) => {
    if (field === 'cycle') return ['tracker', 'calendar'];
    if (field === 'charts') return ['insights'];
    return [field];
  });
  const allowed = new Set(['symptoms', 'insights', 'tracker', 'calendar']);
  const normalized = mapped.filter((field) => allowed.has(field));
  return Array.from(new Set(normalized.length ? normalized : ['symptoms', 'insights', 'tracker', 'calendar']));
}

// ─── Partner Direct Chat ──────────────────────────────────────────────────────

export async function getPartnerMessages(userId: string): Promise<IPartnerChatMessage[]> {
  const user = await User.findById(userId).lean();
  if (!user?.partnerId) {
    return [];
  }

  const partnerId = user.partnerId;
  const messages = await PartnerChatMessage.find({
    $or: [
      { senderId: userId, receiverId: partnerId },
      { senderId: partnerId, receiverId: userId }
    ]
  })
    .sort({ createdAt: 1 })
    .lean();

  return messages.map((m) => ({
    id: String(m._id),
    senderId: String(m.senderId),
    receiverId: String(m.receiverId),
    text: m.text,
    createdAt: m.createdAt,
  }));
}

export async function sendPartnerMessage(userId: string, text: string): Promise<IPartnerChatMessage> {
  const user = await User.findById(userId).lean();
  if (!user?.partnerId) {
    throw httpError('You must pair with a partner before sending a message', 400);
  }

  const partnerId = user.partnerId;
  const now = Date.now();

  const msg = await PartnerChatMessage.create({
    senderId: userId,
    receiverId: partnerId,
    text,
    createdAt: now,
  });

  return {
    id: String(msg._id),
    senderId: String(msg.senderId),
    receiverId: String(msg.receiverId),
    text: msg.text,
    createdAt: msg.createdAt,
  };
}

export async function suggestReplies(userId: string): Promise<string[]> {
  const user = await User.findById(userId).lean();
  if (!user?.partnerId) {
    throw httpError('You must pair with a partner to get suggestions', 400);
  }

  const ladyId = user.role === 'partner' ? user.partnerId : userId;
  const ladyUser = await User.findById(ladyId).lean();
  const ladyName = ladyUser?.name || 'Partner';

  const dashboard = await Dashboard.findOne({ userId: ladyId }).lean();
  let currentDay = 1;
  let phaseLabel = 'Menstrual';

  if (dashboard?.lastPeriodStart) {
    const start = new Date(`${dashboard.lastPeriodStart}T12:00:00`);
    if (!isNaN(start.getTime())) {
      const diff = Math.floor((Date.now() - start.getTime()) / 86_400_000);
      const cycle = dashboard.typicalCycleDays || 28;
      currentDay = (((diff % cycle) + cycle) % cycle) + 1;
    }
    phaseLabel = dashboard.phaseLabel ?? 'Menstrual';
  }

  const today = new Date().toISOString().split('T')[0];
  const logDoc = await SymptomLog.findOne({ userId: ladyId, date: today }).lean();
  const symptomsList: string[] = logDoc?.symptoms ?? [];
  const symptomsText = symptomsList.length > 0
    ? symptomsList.join(', ')
    : 'No symptoms';
  const mucusText = logDoc?.mucus || 'Not logged';
  const lhText = logDoc?.lhLevel || 'Not logged';

  const groqApiKey = process.env.GROQ_API_KEY;

  // Local fallback templates
  const fallbackSuggestions: string[] = [];

  // Fetch lady's custom symptom definitions to check custom labels
  const customDefs = await CustomSymptom.find({ userId: ladyId }).lean();
  const loggedCustomLabels = symptomsList
    .map(id => customDefs.find(c => String(c._id) === id)?.label.toLowerCase() || '')
    .filter(Boolean);

  const hasCramps = symptomsList.some(s => s === 'phys-cramps' || s === 'endo-pelvicpain' || s === 'endo-backache') ||
    loggedCustomLabels.some(l => l.includes('cramp') || l.includes('pain') || l.includes('ache'));

  const hasFatigue = symptomsList.some(s => s === 'phys-fatigue' || s === 'peri-brainfog') ||
    loggedCustomLabels.some(l => l.includes('fatigue') || l.includes('exhaust') || l.includes('tired') || l.includes('fog'));

  const hasCravings = loggedCustomLabels.some(l => l.includes('craving') || l.includes('sweet') || l.includes('chocolate'));

  const hasCalm = symptomsList.includes('mood-calm') ||
    loggedCustomLabels.some(l => l.includes('calm') || l.includes('space'));

  // Symptom-based specific templates
  if (hasCramps) {
    fallbackSuggestions.push("Can I bring you a warm water bottle or some tea? ☕");
    fallbackSuggestions.push("I've got dinner covered tonight, just rest. 🍳");
  }
  if (hasFatigue) {
    fallbackSuggestions.push("Don't worry about anything tonight, I'll handle the chores. 🛌");
    fallbackSuggestions.push("Take all the time you need to rest, I'm right here. ❤️");
  }
  if (hasCravings) {
    fallbackSuggestions.push("I'm heading home, would you like me to pick up some chocolate? 🍫");
  }
  if (hasCalm) {
    fallbackSuggestions.push("I'll make sure you have a quiet, peaceful space to rest today. 🤫");
  }

  // Phase-based fallback additions
  if (phaseLabel.toLowerCase() === 'menstrual') {
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("I'm here to support you. Let's have a quiet evening. ❤️");
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("Can I run a warm bath or get a heating pad for you? 🛁");
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("I've got dinner covered tonight, just rest. 🍳");
  } else if (phaseLabel.toLowerCase() === 'luteal') {
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("I know today might feel heavy. I'm here for you. ❤️");
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("Let me handle the chores tonight so you can relax. 🛌");
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("Would you like some sweet treats or chocolate? 🍫");
  } else if (phaseLabel.toLowerCase() === 'ovulatory' || phaseLabel.toLowerCase() === 'fertile' || phaseLabel.toLowerCase() === 'ovulation') {
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("You're glowing today! Want to go out for a special date? 🌟");
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("I'm so proud of you. Let's do something fun tonight! 🏃‍♂️");
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("Your energy is amazing today. How can I match it? ✨");
  } else {
    // Follicular or fallback
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("Hope you're having a lovely day! Let me know if you need anything. 🤍");
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("Let's go for a gentle walk and get some fresh air. 🌳");
    if (fallbackSuggestions.length < 3) fallbackSuggestions.push("What's on your mind today? I'm all ears. ☕");
  }

  // Ensure we always return exactly 3 suggestions
  const defaultSuggestions = [
    "I'm here for you. Let me know how I can help today. ❤️",
    "I've got dinner covered tonight, just relax. 🍳",
    "Can I bring you a warm cup of tea? ☕"
  ];

  while (fallbackSuggestions.length < 3) {
    const nextDefault = defaultSuggestions.find(d => !fallbackSuggestions.includes(d));
    if (nextDefault) {
      fallbackSuggestions.push(nextDefault);
    } else {
      fallbackSuggestions.push(defaultSuggestions[0]);
    }
  }

  if (!groqApiKey) {
    return fallbackSuggestions.slice(0, 3);
  }

  const prompt = `You are an expert menstrual cycle empathy translator. Your job is to suggest exactly 3 short, comforting, warm, and highly empathetic chat replies (maximum 12 words each) that a partner can type to send to their lady (named ${ladyName}).
The lady's current cycle context:
- Cycle Phase: ${phaseLabel}
- Cycle Day: Day ${currentDay}
- Logged Symptoms: ${symptomsText}
- Cervical Mucus: ${mucusText}
- LH level: ${lhText}

Based on this, generate 3 warm, highly empathetic, and direct messages that the partner could say to support her (e.g. comfort, taking over chores, warm tea, validation).
Return ONLY a valid JSON array of strings. Do not include markdown, code tags, or comments.
Example format:
["I'm heading home, would you like me to pick up some chocolate?", "I've got dinner covered tonight so you can rest.", "I'm here for you. Do you want a warm water bottle?"]`;

  try {
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      return fallbackSuggestions.slice(0, 3);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    let content = data?.choices?.[0]?.message?.content?.trim() || '';

    // Strip out triple backticks if present
    content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

    const match = content.match(/\[\s*".*?"\s*(,\s*".*?"\s*)*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3);
      }
    }

    return fallbackSuggestions.slice(0, 3);
  } catch (error) {
    console.error('[Groq Partner Suggestions Exception]', error);
    return fallbackSuggestions.slice(0, 3);
  }
}
