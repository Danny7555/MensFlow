import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { ChatMessage } from '../models/Chat';
import { User } from '../models/User';
import { Dashboard } from '../models/Dashboard';
import { SymptomLog } from '../models/Symptom';
import { IChatMessage, ISessionSummary } from '../interfaces';
import { httpError } from '../utils/http';

// ─── Session List ─────────────────────────────────────────────────────────────

export async function getSessions(userId: string): Promise<ISessionSummary[]> {
  const sessions = await ChatMessage.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: '$sessionId',
        isLocked: { $last: '$isLocked' },
        securityQuestion: { $last: '$securityQuestion' },
        createdAt: { $first: '$createdAt' },
        lastActiveAt: { $last: '$createdAt' },
        messageCount: { $sum: 1 },
        title: { $first: '$text' },
      },
    },
    { $sort: { lastActiveAt: -1 } },
  ]);

  return sessions.map((s) => ({
    sessionId: s._id,
    isLocked: s.isLocked,
    securityQuestion: s.securityQuestion,
    createdAt: s.createdAt,
    messageCount: s.messageCount,
    title: s.title || 'New Conversation',
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

  if (meta.isLocked) {
    const passcodeOk = passcode ? await bcrypt.compare(passcode, meta.passcode ?? '') : false;
    if (!passcodeOk) {
      throw httpError('Chat is locked — provide the correct passcode', 403, {
        securityQuestion: meta.securityQuestion,
        locked: true,
      });
    }
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
  const passcodeHash = meta?.passcode ?? null;
  const securityQuestion = meta?.securityQuestion ?? null;
  const securityAnswerHash = meta?.securityAnswerHash ?? null;

  if (isLocked) {
    const passcodeOk = passcode ? await bcrypt.compare(passcode, passcodeHash ?? '') : false;
    if (!passcodeOk) {
      throw httpError('Chat is locked — passcode verification failed', 403, {
        securityQuestion,
        locked: true,
      });
    }
  }

  const history = await ChatMessage.find({ userId, sessionId }).sort({ createdAt: 1 }).lean();
  const historyMessages = history.map(toMessageInterface);

  const now = Date.now();

  const userMsg = await ChatMessage.create({
    userId,
    sessionId,
    role: 'user',
    text,
    isLocked,
    passcode: passcodeHash,
    securityQuestion,
    securityAnswerHash,
    createdAt: now,
  });

  const aiText = await buildAIResponse(userId, text, historyMessages);

  const assistantMsg = await ChatMessage.create({
    userId,
    sessionId,
    role: 'assistant',
    text: aiText,
    isLocked,
    passcode: passcodeHash,
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
    throw httpError('Chat session not found', 404);
  }

  const [passcodeHash, securityAnswerHash] = await Promise.all([
    bcrypt.hash(passcode, 10),
    bcrypt.hash(securityAnswer.toLowerCase().trim(), 10),
  ]);

  await ChatMessage.updateMany(
    { userId, sessionId },
    { $set: { isLocked: true, passcode: passcodeHash, securityQuestion, securityAnswerHash } }
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
    throw httpError('Chat session not found', 404);
  }

  if (passcode) {
    const isMatch = await bcrypt.compare(passcode, meta.passcode ?? '');
    if (!isMatch) {
      throw httpError('Invalid passcode', 400);
    }
    return {};
  }

  if (securityAnswer) {
    if (!meta.securityAnswerHash) {
      throw httpError('No security question configured', 400);
    }
    const isMatch = await bcrypt.compare(securityAnswer.toLowerCase().trim(), meta.securityAnswerHash);
    if (!isMatch) {
      throw httpError('Security answer is incorrect', 400);
    }
    // We no longer return the raw passcode — the session is considered unlocked
    return {};
  }

  throw httpError('Provide passcode or securityAnswer', 400);
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  await ChatMessage.deleteMany({ userId, sessionId });
}

// ─── AI Response Builder ──────────────────────────────────────────────────────

async function buildAIResponse(
  userId: string,
  promptText: string,
  history: IChatMessage[]
): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return "MensFlow AI requires the Groq API key to be set. Please add `GROQ_API_KEY` to the `.env` file on the backend and restart the server to enable chat.";
  }

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
  const symptomsText = symptomsList.length > 0
    ? `Symptoms logged today: ${symptomsList.join(', ')}`
    : `No symptoms logged today.`;

  const systemMessage = `You are MensFlow, a warm, highly empathetic, and supportive relationship assistant.
You help a partner support their loved one (named ${targetName}) during their menstrual cycle.

Current context for ${targetName}:
- Cycle Phase: ${phaseLabel}
- Cycle Day: Day ${currentDay}
- ${symptomsText}

Instructions:
1. Provide actionable, highly practical, and compassionate suggestions tailored to ${targetName}'s current cycle phase and symptoms.
2. Keep your answers concise, engaging, and easy to read (use markdown bullet points, bold text, or short paragraphs).
3. Do not sound clinical or overly robotic. Speak like a supportive relationship coach who understands cycle physiology.
4. Keep context in mind (e.g. if energy is low in Luteal/Menstrual, suggest taking over chores, preparing hot water bottles, run baths, or bringing comfort food; if in Follicular/Ovulatory, suggest active dates, walking, or creative initiatives).
5. If the user asks general relationship or support questions, address them while relating it back to cycle dynamics if relevant.`;

  const recentHistory = history.slice(-15);
  const apiMessages = [
    { role: 'system', content: systemMessage },
    ...recentHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.text
    })),
    { role: 'user', content: promptText }
  ];

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Groq API Error] Status: ${response.status} - ${errorText}`);
      return "An error occurred while connecting to the Groq API. Please make sure your API key is valid and has sufficient credits.";
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[Groq API Warning] Empty response choices');
      return "Received empty response from the Groq AI service. Please try asking again.";
    }

    return content.trim();
  } catch (error) {
    console.error('[Groq API Exception]', error);
    return "Failed to connect to the Groq AI model. Please check the backend server logs for more details.";
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ChatMessageLike {
  _id: unknown;
  userId: unknown;
  sessionId: string;
  role: 'user' | 'assistant';
  text: string;
  isLocked: boolean;
  securityQuestion: string | null;
  createdAt: number;
}

function toMessageInterface(doc: ChatMessageLike): IChatMessage {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    sessionId: doc.sessionId,
    role: doc.role,
    text: doc.text,
    isLocked: doc.isLocked,
    securityQuestion: doc.securityQuestion,
    createdAt: doc.createdAt,
  };
}
