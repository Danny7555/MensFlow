import bcrypt from 'bcryptjs';
import { ChatMessage } from '../models/Chat';
import { User } from '../models/User';
import { Dashboard } from '../models/Dashboard';
import { SymptomLog } from '../models/Symptom';
import { IChatMessage, ISessionSummary } from '../interfaces';

// ─── Session List ─────────────────────────────────────────────────────────────

export async function getSessions(userId: string): Promise<ISessionSummary[]> {
  const sessions = await ChatMessage.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: '$sessionId',
        isLocked: { $first: '$isLocked' },
        securityQuestion: { $first: '$securityQuestion' },
        createdAt: { $min: '$createdAt' },
        messageCount: { $sum: 1 },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return sessions.map((s) => ({
    sessionId: s._id,
    isLocked: s.isLocked,
    securityQuestion: s.securityQuestion,
    createdAt: s.createdAt,
    messageCount: s.messageCount,
  }));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(
  userId: string,
  sessionId: string,
  passcode?: string
): Promise<IChatMessage[]> {
  const meta = await ChatMessage.findOne({ userId, sessionId }).lean();
  if (!meta) return [];

  if (meta.isLocked && passcode !== meta.passcode) {
    throw Object.assign(
      new Error('Chat is locked — provide the correct passcode'),
      { status: 403, securityQuestion: meta.securityQuestion, locked: true }
    );
  }

  const messages = await ChatMessage.find({ userId, sessionId }).sort({ createdAt: 1 }).lean();
  return messages.map(toMessageInterface);
}

// ─── Send Message ─────────────────────────────────────────────────────────────

export async function sendMessage(
  userId: string,
  sessionId: string,
  text: string,
  passcode?: string
): Promise<{ userMessage: IChatMessage; assistantMessage: IChatMessage }> {
  const meta = await ChatMessage.findOne({ userId, sessionId }).lean();

  const isLocked = meta?.isLocked ?? false;
  const storedPasscode = meta?.passcode ?? null;
  const securityQuestion = meta?.securityQuestion ?? null;
  const securityAnswerHash = meta?.securityAnswerHash ?? null;

  if (isLocked && passcode !== storedPasscode) {
    throw Object.assign(
      new Error('Chat is locked — passcode verification failed'),
      { status: 403, securityQuestion, locked: true }
    );
  }

  const now = Date.now();

  const userMsg = await ChatMessage.create({
    userId,
    sessionId,
    role: 'user',
    text,
    isLocked,
    passcode: storedPasscode,
    securityQuestion,
    securityAnswerHash,
    createdAt: now,
  });

  const aiText = await buildAIResponse(userId, text);

  const assistantMsg = await ChatMessage.create({
    userId,
    sessionId,
    role: 'assistant',
    text: aiText,
    isLocked,
    passcode: storedPasscode,
    securityQuestion,
    securityAnswerHash,
    createdAt: now + 10,
  });

  return {
    userMessage: toMessageInterface(userMsg),
    assistantMessage: toMessageInterface(assistantMsg),
  };
}

// ─── Lock / Unlock ───────────────────────────────────────────────────────────

export async function lockSession(
  userId: string,
  sessionId: string,
  passcode: string,
  securityQuestion: string,
  securityAnswer: string
): Promise<void> {
  const exists = await ChatMessage.exists({ userId, sessionId });
  if (!exists) {
    throw Object.assign(new Error('Chat session not found'), { status: 404 });
  }

  const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

  await ChatMessage.updateMany(
    { userId, sessionId },
    { $set: { isLocked: true, passcode, securityQuestion, securityAnswerHash } }
  );
}

export async function unlockSession(
  userId: string,
  sessionId: string,
  passcode?: string,
  securityAnswer?: string
): Promise<{ passcode?: string }> {
  const meta = await ChatMessage.findOne({ userId, sessionId }).lean();
  if (!meta) {
    throw Object.assign(new Error('Chat session not found'), { status: 404 });
  }

  if (passcode) {
    if (passcode !== meta.passcode) {
      throw Object.assign(new Error('Invalid passcode'), { status: 400 });
    }
    return {};
  }

  if (securityAnswer) {
    if (!meta.securityAnswerHash) {
      throw Object.assign(new Error('No security question configured'), { status: 400 });
    }
    const isMatch = await bcrypt.compare(securityAnswer.toLowerCase().trim(), meta.securityAnswerHash);
    if (!isMatch) {
      throw Object.assign(new Error('Security answer is incorrect'), { status: 400 });
    }
    return { passcode: meta.passcode ?? undefined };
  }

  throw Object.assign(new Error('Provide passcode or securityAnswer'), { status: 400 });
}

// ─── AI Response Generator ───────────────────────────────────────────────────

async function buildAIResponse(userId: string, promptText: string): Promise<string> {
  const user = await User.findById(userId).lean();
  let targetId: string = userId;
  let targetName: string = user?.name ?? 'Partner';

  if (user?.partnerId) {
    const partner = await User.findById(user.partnerId).lean();
    if (partner) {
      targetId = String(partner._id);
      targetName = partner.name;
    }
  }

  const dashboard = await Dashboard.findOne({ userId: targetId }).lean();
  let currentDay = 1;
  let phaseLabel = 'Luteal';

  if (dashboard?.lastPeriodStart) {
    const start = new Date(`${dashboard.lastPeriodStart}T12:00:00`);
    if (!isNaN(start.getTime())) {
      const diff = Math.floor((Date.now() - start.getTime()) / 86_400_000);
      const cycle = dashboard.typicalCycleDays || 28;
      currentDay = (((diff % cycle) + cycle) % cycle) + 1;
    }
    phaseLabel = dashboard.phaseLabel ?? 'Luteal';
  }

  const today = new Date().toISOString().split('T')[0];
  const logDoc = await SymptomLog.findOne({ userId: targetId, date: today }).lean();
  const symptomsList: string[] = logDoc?.symptoms ?? [];

  return generateResponse(promptText, targetName, currentDay, phaseLabel, symptomsList);
}

function generateResponse(
  promptText: string,
  partnerName: string,
  currentDay: number,
  phase: string,
  symptomsList: string[]
): string {
  const p = promptText.toLowerCase();
  const has = (...words: string[]) => words.some((w) => p.includes(w));

  const phase_ = phase.toLowerCase();
  const isLuteal = phase_.includes('luteal');
  const isMenstrual = phase_.includes('menstrual');
  const isFertile = phase_.includes('ovulatory') || phase_.includes('fertile');

  if (has('cramp', 'pain', 'hurt')) {
    if (isMenstrual) {
      return `Physical cramps on Day ${currentDay} are common in the **Menstrual Phase**. Prepare a warm water bottle or heating pad for ${partnerName}. Herbal teas (raspberry leaf, ginger) and foods rich in magnesium (dark chocolate, bananas) will help ease the spasms. Quietly taking over chores so she can rest without asking will mean the world to her. ❤️`;
    }
    if (isLuteal) {
      return `In the **Luteal Phase**, rising prostaglandins can cause premenstrual cramping for ${partnerName}. A warm magnesium bath, gentle stretching, or cozy rest will help soothe her nervous system. Quietly taking over chores tonight will make an immense difference. ❤️`;
    }
    return `Since ${partnerName} is not near her period, these could be minor ovulation cramps (mittelschmerz). Gentle warmth and hydration are great first steps. Check in softly and let her guide you. 🌸`;
  }

  if (has('food', 'eat', 'cook', 'dinner', 'crave', 'chocolate')) {
    if (isMenstrual) return `For the **Menstrual Phase**, ${partnerName} needs iron-rich, warm foods — bone broth, beef, spinach pasta, or dark chocolate (70%+). Avoid cold or carbonated drinks which can worsen bloating. 🍲`;
    if (isLuteal) return `In the **Luteal Phase** metabolism rises 100–300 calories and serotonin drops. Cook comforting complex carbs — sweet potatoes, brown rice, oats — and offer avocado or nut butter to prevent blood sugar crashes for ${partnerName}. 🥑`;
    if (isFertile) return `In the **Ovulatory Phase**, ${partnerName} thrives on light, fibre-rich foods — broccoli, sprouts, lean proteins, quinoa. Support her liver as it processes peak estrogen. 🥗`;
    return `In the **Follicular Phase**, keep it light and vibrant for ${partnerName} — stir-fries, salads, and citrus fruits match her rising energy perfectly. 🍊`;
  }

  if (has('tired', 'exhaust', 'energy', 'sleep', 'lazy')) {
    if (isLuteal) return `Progesterone in the **Luteal Phase** has a sedative effect and raises body temperature, disrupting sleep for ${partnerName}. Keep the bedroom cool, dim lights early, and reassure her that rest is exactly what her body needs. 🛌`;
    if (isMenstrual) return `The hormone drop in the **Menstrual Phase** drains ${partnerName}'s energy. Let her rest completely — take over meals, dishes, and laundry today. 🕯️`;
    return `Fatigue outside luteal/menstrual phases could be sleep debt or stress for ${partnerName}. Suggest a gentle evening walk to reset serotonin together. 🌳`;
  }

  if (has('mood', 'sad', 'angry', 'cry', 'irritable', 'pms', 'space')) {
    if (isLuteal) return `On Day ${currentDay} of the **Luteal Phase**, dropping estrogen and progesterone reduce serotonin — this is a physical shift, not personal. Give ${partnerName} space and say: *"Take all the time you need, I've got things handled. I love you."* 🤍`;
    if (isMenstrual) return `In the **Menstrual Phase**, ${partnerName} may feel vulnerable. Offer validation rather than solutions — a warm hug, soft tones, and listening go further than advice. 🌸`;
    return `Hormones are rising right now, so sudden drops may be external stress for ${partnerName}. Listen actively and let her vent without jumping to advice unless she asks. ☕`;
  }

  if (has('support', 'help', 'what', 'do', 'care', 'how')) {
    const tips = isMenstrual
      ? ['Keep a heating pad ready and prepare chamomile or ginger tea', 'Handle meals, dishes and laundry without being asked', 'Validate her discomfort — reassure her she is safe and loved']
      : isLuteal
      ? ['Dim lights, keep the house quiet, cool the bedroom (progesterone raises body temp)', 'Bring a comforting snack — avocado, dark chocolate, or sweet potato fries', "Don't take irritability personally — give her space to nest and recharge"]
      : isFertile
      ? ['Plan a meaningful date night — she is at peak social energy', 'Share deep conversations and match her outgoing momentum', 'Great time for new adventures or starting new projects together']
      : ['Suggest an evening stroll or light activity', 'Try cooking a new recipe together', 'Brainstorm future plans or travel ideas'];

    return `The best way to support ${partnerName} right now (**${phase}**, Day ${currentDay}):\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
  }

  if (has('phase', 'cycle', 'current')) {
    const desc = isMenstrual
      ? 'The uterine lining is shedding, hormones are at their lowest, and physical rest and warmth are the priority.'
      : isLuteal
      ? 'High progesterone is slowing her digestion and reducing serotonin — expect nesting behaviours, sleepiness, and cravings.'
      : isFertile
      ? 'Peak estrogen and testosterone are driving high confidence, communication, and social energy.'
      : 'Rising estrogen is steadily lifting fatigue and increasing mental focus and physical energy.';

    return `${partnerName} is on **Day ${currentDay}** of her cycle — currently in the **${phase}**. ${desc}`;
  }

  const symptomsText =
    symptomsList.length > 0
      ? `She has logged: **${symptomsList.join(', ')}** today. These are strong cues to focus on gentle comfort and support.`
      : `She hasn't logged symptoms yet today — a soft check-in goes a long way.`;

  return `Hi! I'm MensFlow — your empathetic relationship guide. ${partnerName} is on **Day ${currentDay}** (${phase}). ${symptomsText} Ask me about cramps, food, fatigue, moods, or how to support her today. 🌸`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMessageInterface(doc: any): IChatMessage {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    sessionId: doc.sessionId,
    role: doc.role,
    text: doc.text,
    isLocked: doc.isLocked,
    passcode: doc.passcode,
    securityQuestion: doc.securityQuestion,
    securityAnswerHash: doc.securityAnswerHash,
    createdAt: doc.createdAt,
  };
}
