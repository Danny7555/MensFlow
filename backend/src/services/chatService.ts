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

  const history = await ChatMessage.find({ userId, sessionId }).sort({ createdAt: 1 }).lean();
  const historyMessages = history.map(toMessageInterface);

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

  const aiText = await buildOpenRouterAIResponse(userId, text, historyMessages);

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

async function buildOpenRouterAIResponse(
  userId: string,
  promptText: string,
  history: IChatMessage[]
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return "MensFlow AI requires the OpenRouter API key to be set. Please add `OPENROUTER_API_KEY` to the `.env` file on the backend and restart the server to enable chat.";
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

  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5001',
        'X-Title': 'MensFlow'
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OpenRouter API Error] Status: ${response.status} - ${errorText}`);
      return "An error occurred while connecting to the OpenRouter API. Please make sure your API key is valid and has sufficient credits.";
    }

    const data = await response.json() as any;
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[OpenRouter API Warning] Empty response choices');
      return "Received empty response from the AI service. Please try asking again.";
    }

    return content.trim();
  } catch (error) {
    console.error('[OpenRouter API Exception]', error);
    return "Failed to connect to the AI model. Please check the backend server logs for more details.";
  }
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
