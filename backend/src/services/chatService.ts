import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { ChatMessage } from '../models/Chat';
import { User } from '../models/User';
import { Settings } from '../models/Settings';
import { Dashboard } from '../models/Dashboard';
import { SymptomLog, CustomSymptom } from '../models/Symptom';
import { IChatMessage, ISessionSummary } from '../interfaces';
import { httpError } from '../utils/http';
import { buildCycleModel } from '../utils/cycleModel';

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
    let passcodeOk = passcode ? await bcrypt.compare(passcode, meta.passcode ?? '') : false;
    if (!passcodeOk && passcode) {
      const user = await User.findById(userId).lean();
      if (user && user.passwordHash) {
        passcodeOk = await bcrypt.compare(passcode, user.passwordHash);
      }
    }
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
  const user = await User.findById(userId).lean();
  if (!user) {
    throw httpError('User not found', 404);
  }

  // Enforce message limit for users with < 500 XP
  if ((user.xp || 0) < 500) {
    const userMsgCount = await ChatMessage.countDocuments({ userId, role: 'user' });
    if (userMsgCount >= 5) {
      throw httpError(
        `Chat limit reached. You have used your 5 free messages. Complete daily quizzes to reach 500 XP and unlock unlimited AI assistant access! (Current XP: ${user.xp || 0}/500)`,
        403
      );
    }
  }

  const meta = await ChatMessage.findOne({ userId, sessionId }).lean();

  const isLocked = meta?.isLocked ?? false;
  const passcodeHash = meta?.passcode ?? null;
  const securityQuestion = meta?.securityQuestion ?? null;
  const securityAnswerHash = meta?.securityAnswerHash ?? null;

  if (isLocked) {
    let passcodeOk = passcode ? await bcrypt.compare(passcode, passcodeHash ?? '') : false;
    if (!passcodeOk && passcode) {
      const user = await User.findById(userId).lean();
      if (user && user.passwordHash) {
        passcodeOk = await bcrypt.compare(passcode, user.passwordHash);
      }
    }
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

  // Extract cycle data from user's message and populate dashboard/logs
  await extractAndSaveCycleData(userId, text);

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
  passcode?: string,
  securityQuestion?: string,
  securityAnswer?: string
): Promise<void> {
  const exists = await ChatMessage.exists({ userId, sessionId });
  if (!exists) {
    throw httpError('Chat session not found', 404);
  }

  let finalPasscode = passcode;
  let finalQuestion = securityQuestion;
  let finalAnswer = securityAnswer;

  if (!finalPasscode || !finalQuestion || !finalAnswer) {
    const settings = await Settings.findOne({ userId }).lean();
    if (!settings || !settings.privacyLockChatsPassword) {
      throw httpError('Locked chats feature is not set up or enabled in Settings', 400);
    }
    finalPasscode = finalPasscode || settings.privacyLockChatsPassword;
    finalQuestion = finalQuestion || settings.privacyLockChatsSecurityQuestion || '';
    finalAnswer = finalAnswer || settings.privacyLockChatsSecurityAnswer || '';
  }

  if (!finalPasscode || !finalQuestion || !finalAnswer) {
    throw httpError('Passcode, security question, and answer must be configured', 400);
  }

  const [passcodeHash, securityAnswerHash] = await Promise.all([
    bcrypt.hash(finalPasscode, 10),
    bcrypt.hash(finalAnswer.toLowerCase().trim(), 10),
  ]);

  await ChatMessage.updateMany(
    { userId, sessionId },
    { $set: { isLocked: true, passcode: passcodeHash, securityQuestion: finalQuestion, securityAnswerHash } }
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
    let isMatch = await bcrypt.compare(passcode, meta.passcode ?? '');
    if (!isMatch) {
      const user = await User.findById(userId).lean();
      if (user && user.passwordHash) {
        isMatch = await bcrypt.compare(passcode, user.passwordHash);
      }
    }
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
    return {};
  }

  throw httpError('Provide passcode or securityAnswer', 400);
}

export async function unlockSessionPermanent(
  userId: string,
  sessionId: string,
  passcode?: string
): Promise<void> {
  const meta = await ChatMessage.findOne({ userId, sessionId }).lean();
  if (!meta) {
    throw httpError('Chat session not found', 404);
  }

  if (meta.isLocked) {
    if (!passcode) {
      throw httpError('Passcode/password is required to unlock permanently', 400);
    }
    let isMatch = await bcrypt.compare(passcode, meta.passcode ?? '');
    if (!isMatch) {
      const user = await User.findById(userId).lean();
      if (user && user.passwordHash) {
        isMatch = await bcrypt.compare(passcode, user.passwordHash);
      }
    }
    if (!isMatch) {
      throw httpError('Invalid passcode/password', 400);
    }
  }

  await ChatMessage.updateMany(
    { userId, sessionId },
    {
      $set: {
        isLocked: false,
        passcode: null,
        securityQuestion: null,
        securityAnswerHash: null,
      },
    }
  );
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
  let targetName: string = user?.name ?? 'you';
  const isPartnerUser = user?.role === 'partner';

  if (isPartnerUser && user?.partnerId) {
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
    const model = buildCycleModel({
      lastPeriodStart: dashboard.lastPeriodStart,
      typicalCycleDays: dashboard.typicalCycleDays,
      cycleVariationDays: dashboard.cycleVariationDays,
    });
    currentDay = model.cycleDay;
    phaseLabel = model.phaseLabel;
  }

  const today = new Date().toISOString().split('T')[0];
  const logDoc = await SymptomLog.findOne({ userId: targetId, date: today }).lean();
  const symptomsList: string[] = logDoc?.symptoms ?? [];
  const symptomsText = symptomsList.length > 0
    ? `Symptoms logged today: ${symptomsList.join(', ')}`
    : `No symptoms logged today.`;

  const systemMessage = isPartnerUser
    ? `You are MensFlow, a warm, highly empathetic partner-support assistant.
You help the user support their partner (named ${targetName}) during her menstrual cycle.

Current context for ${targetName}:
- Cycle Phase: ${phaseLabel}
- Cycle Day: Day ${currentDay}
- ${symptomsText}

Instructions:
1. Provide actionable, highly practical, and compassionate suggestions tailored to ${targetName}'s current cycle phase and symptoms.
2. Keep your answers friendly, short, and easy to read: aim for 60-100 words, max 3 bullets, no long paragraphs.
3. Do not sound clinical or overly robotic. Speak like a supportive relationship coach who understands cycle physiology.
4. Keep context in mind (e.g. if energy is low in Luteal/Menstrual, suggest taking over chores, preparing hot water bottles, run baths, or bringing comfort food; if in Follicular/Ovulatory, suggest active dates, walking, or creative initiatives).
5. If the user asks general relationship or support questions, address them while relating it back to cycle dynamics if relevant.
6. Use 1-3 warm emojis where natural, but do not overdo it.
7. CRITICAL: You must NOT ask any questions or engage in discussions about topics outside of general health, cycle tracking, cycle physiology, and supporting a partner through their menstrual cycle. If the user asks about unrelated topics (such as general news, sports, math, coding, generic cooking recipes, etc.), politely decline to discuss them and steer the conversation back to menstrual health, relationship support, or cycle symptoms. Under no circumstances should you initiate questions or ask the user questions about any topic outside of health or menstrual cycle tracking.`
    : `You are MensFlow, a warm, highly empathetic cycle-tracking and self-care assistant.
You help the user understand their own menstrual cycle, symptoms, flow, mood, body signals, and daily care needs.

Current context for the user:
- Name: ${targetName}
- Cycle Phase: ${phaseLabel}
- Cycle Day: Day ${currentDay}
- ${symptomsText}

Instructions:
1. Speak directly to the user using "you" and "your". Do not assume they are asking about a partner.
2. Provide practical, compassionate self-care, tracking, nutrition, rest, movement, and symptom-logging suggestions tailored to their current cycle phase and symptoms.
3. Keep answers friendly, short, and easy to read: aim for 60-100 words, max 3 bullets, no long paragraphs.
4. If the user asks about partner support, you may include a small optional partner note, but the default perspective must be the user's own body and experience.
5. Do not sound clinical or robotic. Be warm, clear, and grounded in cycle physiology.
6. Use 1-3 warm emojis where natural, but do not overdo it.
7. CRITICAL: You must NOT discuss unrelated topics. If the user asks about general news, sports, coding, or other unrelated subjects, politely redirect to menstrual health, cycle tracking, symptoms, or self-care.`;

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
        temperature: 0.75,
        max_tokens: 180
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

// ─── Data Extraction from Chat ────────────────────────────────────────────────

async function extractAndSaveCycleData(userId: string, text: string): Promise<void> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) return;

  try {
    const user = await User.findById(userId).lean();
    if (!user) return;
    const targetId = (user.role === 'partner' && user.partnerId) ? String(user.partnerId) : userId;

    const today = new Date().toISOString().split('T')[0];

    const customSymptoms = await CustomSymptom.find({ userId: targetId }).lean();
    let customText = '';
    if (customSymptoms.length > 0) {
      customText = `\n   - Custom symptoms configured by the user (match these to their corresponding ID if mentioned):\n` +
        customSymptoms.map(c => `     - "${c.label}" -> "${c._id}"`).join('\n');
    }

    const prompt = `You are a data extraction assistant for MensFlow, a menstrual cycle tracking app.
Analyze the user's message below (which may be from a woman tracking her own cycle, or from her partner reporting on her cycle/symptoms/flow).
Extract any of the following fields if they are mentioned:
1. "lastPeriodStart": A date in YYYY-MM-DD format. If the user mentions their period starting (e.g., "my period started yesterday", "she started her flow today", "started on May 25th"), resolve this relative to today's date (which is ${today}).
2. "typicalCycleDays": The average length of their cycle in days (an integer between 15 and 60, e.g., "my cycle is 30 days").
3. "symptoms": An array of symptom IDs matching the following recognized keys:
   - Flow: "flow-light", "flow-medium", "flow-heavy"
   - Mood: "mood-calm", "mood-happy", "mood-anxious", "mood-sad", "mood-irritable"
   - Physical: "phys-cramps", "phys-headache", "phys-bloating", "phys-fatigue", "phys-tender", "phys-acne"
   - PCOS: "pcos-hirsutism", "pcos-oily", "pcos-hairloss"
   - Endometriosis: "endo-pelvicpain", "endo-painsex", "endo-backache"
   - Perimenopause: "peri-hotflash", "peri-nightsweat", "peri-brainfog"
   - Lifestyle: "life-sleep", "life-bbt", "life-sex", "life-pill"${customText}
   (e.g., "she is having severe cramps and light flow today" -> ["phys-cramps", "flow-light"])
4. "water": Daily water intake in ml (e.g., "drank 1500ml water", "drank 2 liters of water").
5. "weight": Body weight in kg (e.g., "my weight is 61.5 kg", "she weighs 60kg").

User Message: "${text}"

Respond ONLY with a valid JSON object containing any of the extracted fields. If nothing matches, respond with {}. Do not include markdown formatting, backticks, explanation, or comments.
Example Output:
{
  "lastPeriodStart": "2026-05-29",
  "symptoms": ["phys-cramps", "flow-heavy"]
}`;

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
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error('[Groq Extraction Error] API returned status:', response.status);
      return;
    }

    const responseData = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    let content = responseData?.choices?.[0]?.message?.content?.trim() || '';
    
    // Clean JSON formatting
    content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

    if (!content.startsWith('{') || !content.endsWith('}')) {
      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        content = match[0];
      } else {
        return;
      }
    }

    const extracted = JSON.parse(content);
    if (!extracted || typeof extracted !== 'object') return;

    // 1. Update Dashboard
    const dashboardPatch: any = {};
    if (extracted.lastPeriodStart && /^\d{4}-\d{2}-\d{2}$/.test(extracted.lastPeriodStart)) {
      const parsedDate = new Date(extracted.lastPeriodStart);
      if (!Number.isNaN(parsedDate.getTime()) && parsedDate <= new Date()) {
        dashboardPatch.lastPeriodStart = extracted.lastPeriodStart;
      }
    }
    if (extracted.typicalCycleDays && typeof extracted.typicalCycleDays === 'number' && extracted.typicalCycleDays >= 15 && extracted.typicalCycleDays <= 60) {
      dashboardPatch.typicalCycleDays = extracted.typicalCycleDays;
    }

    if (Object.keys(dashboardPatch).length > 0) {
      const currentDashboard = await Dashboard.findOne({ userId: new Types.ObjectId(targetId) }).lean();
      const model = buildCycleModel({
        lastPeriodStart: dashboardPatch.lastPeriodStart ?? currentDashboard?.lastPeriodStart,
        typicalCycleDays: dashboardPatch.typicalCycleDays ?? currentDashboard?.typicalCycleDays,
        cycleVariationDays: currentDashboard?.cycleVariationDays,
        symptoms: Array.isArray(extracted.symptoms) ? extracted.symptoms : undefined,
      });
      const insertDefaults = dashboardPatch.lastPeriodStart ? {} : { lastPeriodStart: today };
      await Dashboard.findOneAndUpdate(
        { userId: new Types.ObjectId(targetId) },
        {
          $set: {
            ...dashboardPatch,
            phaseLabel: model.phaseLabel,
            hormoneTrend: model.hormoneTrend,
            bodySignals: model.bodySignals,
            guidanceLines: model.guidanceLines,
            cycleVariationDays: model.cycleVariationDays,
            isAtypical: model.isAtypical,
          },
          $setOnInsert: insertDefaults,
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      console.log(`[Chat Extractor] Updated Dashboard for user ${targetId}:`, dashboardPatch);
    }

    // 2. Update Symptom Log
    const symptomPatch: any = {};
    const logDoc = await SymptomLog.findOne({ userId: new Types.ObjectId(targetId), date: today }).lean();

    if (Array.isArray(extracted.symptoms) && extracted.symptoms.length > 0) {
      const standardSymptomIds = new Set([
        'flow-light', 'flow-medium', 'flow-heavy',
        'mood-calm', 'mood-happy', 'mood-anxious', 'mood-sad', 'mood-irritable',
        'phys-cramps', 'phys-headache', 'phys-bloating', 'phys-fatigue', 'phys-tender', 'phys-acne',
        'pcos-hirsutism', 'pcos-oily', 'pcos-hairloss',
        'endo-pelvicpain', 'endo-painsex', 'endo-backache',
        'peri-hotflash', 'peri-nightsweat', 'peri-brainfog',
        'life-sleep', 'life-bbt', 'life-sex', 'life-pill'
      ]);
      const customIds = new Set(customSymptoms.map(c => String(c._id)));

      const validSymptoms = extracted.symptoms.filter((s: any) => 
        typeof s === 'string' && (standardSymptomIds.has(s) || customIds.has(s))
      );
      if (validSymptoms.length > 0) {
        const existingSymptoms = logDoc?.symptoms || [];
        symptomPatch.symptoms = Array.from(new Set([...existingSymptoms, ...validSymptoms]));
      }
    }

    if (extracted.water !== undefined && typeof extracted.water === 'number' && !Number.isNaN(extracted.water)) {
      symptomPatch.water = Math.max(0, Math.min(10000, Math.round(extracted.water)));
    }

    if (extracted.weight !== undefined && typeof extracted.weight === 'number' && !Number.isNaN(extracted.weight)) {
      symptomPatch.weight = Math.max(0, Math.min(500, Math.round(extracted.weight * 10) / 10));
    }

    if (Object.keys(symptomPatch).length > 0) {
      await SymptomLog.findOneAndUpdate(
        { userId: new Types.ObjectId(targetId), date: today },
        { $set: symptomPatch },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      const dashboard = await Dashboard.findOne({ userId: new Types.ObjectId(targetId) }).lean();
      const model = buildCycleModel({
        lastPeriodStart: dashboard?.lastPeriodStart,
        typicalCycleDays: dashboard?.typicalCycleDays,
        cycleVariationDays: dashboard?.cycleVariationDays,
        symptoms: symptomPatch.symptoms,
      });
      await Dashboard.findOneAndUpdate(
        { userId: new Types.ObjectId(targetId) },
        {
          $set: {
            phaseLabel: model.phaseLabel,
            hormoneTrend: model.hormoneTrend,
            bodySignals: model.bodySignals,
            guidanceLines: model.guidanceLines,
            cycleVariationDays: model.cycleVariationDays,
            isAtypical: model.isAtypical,
          },
          $setOnInsert: { lastPeriodStart: today },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      console.log(`[Chat Extractor] Updated SymptomLog for user ${targetId} on ${today}:`, symptomPatch);
    }
  } catch (err) {
    console.error('[Chat Extractor Error]', err);
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

export async function sendGuestMessage(
  text: string,
  history: { role: 'user' | 'assistant'; text: string }[]
): Promise<{ text: string }> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return {
      text: "MensFlow AI requires the Groq API key to be set. Please add `GROQ_API_KEY` to the `.env` file on the backend and restart the server to enable chat."
    };
  }

  const systemMessage = `You are MensFlow, a warm, highly empathetic menstrual cycle, self-care, and partner-support assistant.
Since this is a guest preview session, you do not have custom cycle data yet.
Default to helping the user understand their own cycle using "you" and "your". If they clearly ask as a partner, switch to partner-support advice.
Provide warm, general cycle support suggestions, symptom guidance, tracking tips, and insights.
Instructions:
1. Speak like a supportive cycle coach who understands cycle physiology.
2. Keep your answers friendly, short, and easy to read: aim for 60-100 words, max 3 bullets, no long paragraphs.
3. Encourage the user to sign up or create a free account to log symptoms, sync with their partner, and get personalized, daily advice.
4. Use 1-3 warm emojis where natural, but do not overdo it.
5. CRITICAL: You must NOT ask any questions or engage in discussions about topics outside of general health, cycle tracking, cycle physiology, self-care, and partner support around menstrual cycles. If the user asks about unrelated topics (such as general news, sports, math, coding, generic cooking recipes, etc.), politely decline and steer the conversation back to menstrual health, cycle tracking, or symptoms.`;

  const apiMessages = [
    { role: 'system', content: systemMessage },
    ...history.slice(-15).map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.text
    })),
    { role: 'user', content: text }
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
        temperature: 0.75,
        max_tokens: 180
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Groq Guest API Error] Status: ${response.status} - ${errorText}`);
      return { text: "An error occurred while connecting to the Groq API. Please make sure your API key is valid." };
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { text: "Received empty response from the Groq AI service. Please try asking again." };
    }

    return { text: content.trim() };
  } catch (error) {
    console.error('[Groq Guest API Exception]', error);
    return { text: "Failed to connect to the Groq AI model. Please check the backend server logs for more details." };
  }
}

export async function getSuggestions(userId?: string): Promise<string[]> {
  let phaseLabel = 'Menstrual';
  let currentDay = 1;
  let symptomsText = 'No symptoms logged today';
  let symptomsList: string[] = [];
  let targetName = 'the user';
  let isPartnerUser = false;
  let targetId = userId;

  if (userId) {
    try {
      const user = await User.findById(userId).lean();
      isPartnerUser = user?.role === 'partner';
      targetName = user?.name || targetName;
      if (isPartnerUser && user?.partnerId) {
        const partner = await User.findById(user.partnerId).lean();
        if (partner) {
          targetId = String(partner._id);
          targetName = partner.name;
        }
      }
      
      const dashboard = await Dashboard.findOne({ userId: targetId }).lean();
      if (dashboard?.lastPeriodStart) {
        // Find overrides for dynamic ovulation
        let lhPeakDay: number | null = null;
        let eggWhiteMucusDay: number | null = null;
        const cycleLogs = await SymptomLog.find({
          userId: targetId,
          date: { $gte: dashboard.lastPeriodStart }
        }).lean();

        const start = new Date(dashboard.lastPeriodStart + 'T12:00:00');
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

        const model = buildCycleModel({
          lastPeriodStart: dashboard.lastPeriodStart,
          typicalCycleDays: dashboard.typicalCycleDays,
          cycleVariationDays: dashboard.cycleVariationDays,
          lhPeakDay,
          eggWhiteMucusDay,
        });
        currentDay = model.cycleDay;
        phaseLabel = model.phaseLabel;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const logDoc = await SymptomLog.findOne({ userId: targetId, date: today }).lean();
      symptomsList = logDoc?.symptoms ?? [];
      if (symptomsList.length > 0) {
        symptomsText = `symptoms logged today: ${symptomsList.join(', ')}`;
      }
    } catch (err) {
      console.error('[Groq Suggestions Data Fetch Error]', err);
    }
  }

  // Generate local context-aware suggestions
  const localSuggestions: string[] = [];
  const normalizedPhase = phaseLabel.toLowerCase();

  const hasCramps = symptomsList.some(s => s === 'phys-cramps' || s === 'endo-pelvicpain' || s === 'endo-backache');
  const hasFatigue = symptomsList.some(s => s === 'phys-fatigue' || s === 'peri-brainfog');
  const hasMoodSwings = symptomsList.some(s => s === 'mood-anxious' || s === 'mood-sad' || s === 'mood-irritable');

  if (isPartnerUser) {
    if (hasCramps) {
      localSuggestions.push(`How to support her cramps on Day ${currentDay}?`);
      localSuggestions.push("What foods relieve period cramps?");
    }
    if (hasFatigue) {
      localSuggestions.push("How to support her fatigue today?");
      localSuggestions.push("What triggers period exhaustion?");
    }
    if (hasMoodSwings) {
      localSuggestions.push("How to respond to her luteal mood changes?");
      localSuggestions.push("Empathy translations for PMS irritability");
    }

    if (normalizedPhase.includes('menstru')) {
      if (localSuggestions.length < 3) localSuggestions.push("What should I cook for her Menstrual phase?");
      if (localSuggestions.length < 3) localSuggestions.push("How can I make her period comfortable?");
      if (localSuggestions.length < 3) localSuggestions.push("Should she exercise during bleeding?");
    } else if (normalizedPhase.includes('follicul')) {
      if (localSuggestions.length < 3) localSuggestions.push("Follicular phase date ideas");
      if (localSuggestions.length < 3) localSuggestions.push("How does estrogen affect her energy?");
      if (localSuggestions.length < 3) localSuggestions.push("Best communication strategies for early follicular");
    } else if (normalizedPhase.includes('fertile') || normalizedPhase.includes('ovulat')) {
      if (localSuggestions.length < 3) localSuggestions.push(`What is her fertile window on Day ${currentDay}?`);
      if (localSuggestions.length < 3) localSuggestions.push("How to support her during ovulation?");
      if (localSuggestions.length < 3) localSuggestions.push("Social activities for high energy phases");
    } else {
      // Luteal
      if (localSuggestions.length < 3) localSuggestions.push("How to handle Luteal PMS mood swings?");
      if (localSuggestions.length < 3) localSuggestions.push("Why does she crave chocolate now?");
      if (localSuggestions.length < 3) localSuggestions.push("Comfort actions for Luteal phase");
    }
  } else {
    if (hasCramps) {
      localSuggestions.push(`Why am I cramping on Day ${currentDay}?`);
      localSuggestions.push("Natural remedies for menstrual cramps");
    }
    if (hasFatigue) {
      localSuggestions.push("Why am I so tired today?");
      localSuggestions.push("How to naturally boost my energy");
    }
    if (hasMoodSwings) {
      localSuggestions.push("How to manage PMS mood swings?");
      localSuggestions.push("Why do I feel anxious in luteal?");
    }

    if (normalizedPhase.includes('menstru')) {
      if (localSuggestions.length < 3) localSuggestions.push("What should I eat during my period?");
      if (localSuggestions.length < 3) localSuggestions.push("Gentle stretches for period relief");
      if (localSuggestions.length < 3) localSuggestions.push("Is light bleeding normal?");
    } else if (normalizedPhase.includes('follicul')) {
      if (localSuggestions.length < 3) localSuggestions.push("Leveraging follicular energy");
      if (localSuggestions.length < 3) localSuggestions.push("Best workouts for follicular phase");
      if (localSuggestions.length < 3) localSuggestions.push("Planning tasks around follicular focus");
    } else if (normalizedPhase.includes('fertile') || normalizedPhase.includes('ovulat')) {
      if (localSuggestions.length < 3) localSuggestions.push(`Signs of ovulation on Day ${currentDay}`);
      if (localSuggestions.length < 3) localSuggestions.push("Am I in my fertile window?");
      if (localSuggestions.length < 3) localSuggestions.push("Ovulation pain and high libido");
    } else {
      // Luteal
      if (localSuggestions.length < 3) localSuggestions.push("Self-care for my Luteal phase");
      if (localSuggestions.length < 3) localSuggestions.push("Managing sweet cravings in luteal");
      if (localSuggestions.length < 3) localSuggestions.push("Why am I bloating before my period?");
    }
  }

  // Ensure we always have exactly 3 suggestions
  const defaults = isPartnerUser ? [
    "How can I help with her cramps?",
    "What should I cook for dinner?",
    "How to make her Luteal phase easier?"
  ] : [
    "Why am I cramping today?",
    "What should I log today?",
    "How can I support my energy?"
  ];

  while (localSuggestions.length < 3) {
    const nextDefault = defaults.find(d => !localSuggestions.includes(d));
    if (nextDefault) {
      localSuggestions.push(nextDefault);
    } else {
      localSuggestions.push(defaults[0]);
    }
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return localSuggestions.slice(0, 3);
  }

  const prompt = isPartnerUser
    ? `You are a helpful assistant.
Given a relationship context where a partner wants to support their loved one (named ${targetName}):
- Cycle Phase: ${phaseLabel}
- Cycle Day: Day ${currentDay}
- Status: ${symptomsText}

Generate 3 short, relevant, and highly actionable question prompts (maximum 8 words each) that the partner can ask the AI to get support advice. Focus specifically on supporting the symptoms logged today if any are present (e.g. cramps, fatigue, mood changes).
Return ONLY a valid JSON array of strings. Do not include markdown, bullet points, or explanation.
Example format:
["How can I help with her cramps?", "What should I cook for dinner?", "How to make her Luteal phase easier?"]`
    : `You are a helpful menstrual cycle assistant.
Given this user's own cycle context:
- Cycle Phase: ${phaseLabel}
- Cycle Day: Day ${currentDay}
- Status: ${symptomsText}

Generate 3 short, relevant, and highly actionable question prompts (maximum 8 words each) that the user can ask about their own cycle, symptoms, self-care, or tracking. Focus specifically on addressing the symptoms logged today if any are present (e.g. cramps, fatigue, mood changes).
Return ONLY a valid JSON array of strings. Do not include markdown, bullet points, or explanation.
Example format:
["Why am I cramping today?", "What should I log today?", "How can I support my energy?"]`;

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
      return localSuggestions.slice(0, 3);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content?.trim() || '';
    
    const match = content.match(/\[\s*".*?"\s*(,\s*".*?"\s*)*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3);
      }
    }
    
    return localSuggestions.slice(0, 3);
  } catch (error) {
    console.error('[Groq Suggestions Exception]', error);
    return localSuggestions.slice(0, 3);
  }
}

export async function getDailyGuidance(userId: string): Promise<any> {
  const groqApiKey = process.env.GROQ_API_KEY;

  const defaultGuidance = {
    scientificInsight: "Did you know? Estrogen levels rise, which stimulates the growth of follicles in your ovaries and can increase your cognitive clarity, mood, and physical stamina.",
    dailyTip: {
      title: "Support your energy",
      desc: "Choose one realistic care action today: hydrate, log symptoms, add gentle movement, or protect an earlier rest window."
    },
    wellnessTips: [
      {
        id: "1",
        category: "nutrition",
        title: "Iron + vitamin C pairings",
        summary: "Combine lentils or leafy greens with citrus or bell pepper to improve iron absorption during flow and early luteal.",
        phaseTag: "Menstrual · Luteal"
      },
      {
        id: "2",
        category: "movement",
        title: "Low-impact strength",
        summary: "20 minutes of bodyweight or light bands supports mood without spiking cortisol when energy dips.",
        phaseTag: "Luteal"
      },
      {
        id: "3",
        category: "rest",
        title: "Sleep window consistency",
        summary: "Aim for the same wake time ±45 minutes — progesterone can lighten sleep quality in late luteal.",
        phaseTag: "Luteal"
      }
    ]
  };

  const today = new Date().toISOString().split('T')[0];
  let phaseLabel = 'Menstrual';
  let currentDay = 1;
  let symptomsText = 'No symptoms logged today';
  let targetName = 'the user';
  let targetId = userId;
  let isPartnerUser = false;

  try {
    const user = await User.findById(userId).lean();
    targetName = user?.name || targetName;
    isPartnerUser = user?.role === 'partner';
    if (isPartnerUser && user?.partnerId) {
      const partner = await User.findById(user.partnerId).lean();
      if (partner) {
        targetId = String(partner._id);
        targetName = partner.name;
      }
    }
    
    const dashboard = await Dashboard.findOne({ userId: targetId }).lean();
    if (dashboard && dashboard.guidanceGeneratedDate === today && dashboard.scientificInsight && dashboard.dailyTip) {
      const cachedTipText = `${dashboard.dailyTip.title} ${dashboard.dailyTip.desc}`.toLowerCase();
      const cachedMatchesPerspective = isPartnerUser || !/\b(partner|her|she|support them|support her)\b/.test(cachedTipText);
      if (cachedMatchesPerspective) {
        return {
          scientificInsight: dashboard.scientificInsight,
          dailyTip: dashboard.dailyTip,
          wellnessTips: dashboard.wellnessTips && dashboard.wellnessTips.length > 0 ? dashboard.wellnessTips : defaultGuidance.wellnessTips
        };
      }
    }

    if (dashboard?.lastPeriodStart) {
      const model = buildCycleModel({
        lastPeriodStart: dashboard.lastPeriodStart,
        typicalCycleDays: dashboard.typicalCycleDays,
        cycleVariationDays: dashboard.cycleVariationDays,
      });
      currentDay = model.cycleDay;
      phaseLabel = model.phaseLabel;
    }
    
    const logDoc = await SymptomLog.findOne({ userId: targetId, date: today }).lean();
    const symptomsList = logDoc?.symptoms ?? [];
    if (symptomsList.length > 0) {
      symptomsText = `symptoms logged today: ${symptomsList.join(', ')}`;
    }
  } catch (err) {
    console.error('[Groq Guidance Data Fetch Error]', err);
  }

  if (!groqApiKey) {
    try {
      await Dashboard.findOneAndUpdate(
        { userId: targetId },
        { 
          scientificInsight: defaultGuidance.scientificInsight,
          dailyTip: defaultGuidance.dailyTip,
          guidanceGeneratedDate: today,
          wellnessTips: defaultGuidance.wellnessTips
        },
        { upsert: true }
      );
    } catch (dbErr) {
      console.error('[Groq Guidance DB Save Error - fallback]', dbErr);
    }
    return defaultGuidance;
  }

  const prompt = isPartnerUser
    ? `You are a helpful wellness and partner support assistant.
Given a relationship context where a partner wants to support their loved one (named ${targetName}):
- Cycle Phase: ${phaseLabel}
- Cycle Day: Day ${currentDay}
- Status: ${symptomsText}

Generate a highly personalized daily guidance JSON response matching exactly this format:
{
  "scientificInsight": "Did you know? Estrogen levels rise during the follicular phase and can increase cognitive clarity, mood, and physical stamina.",
  "dailyTip": {
    "title": "Embrace rising energy",
    "desc": "Suggest starting a new creative project or outdoor activity together. Her body is highly responsive to learning and planning."
  },
  "wellnessTips": [
    {
      "id": "1",
      "category": "nutrition",
      "title": "Iron + vitamin C pairings",
      "summary": "Combine lentils or leafy greens with citrus or bell pepper to improve iron absorption during flow and early luteal.",
      "phaseTag": "Menstrual · Luteal"
    },
    {
      "id": "2",
      "category": "movement",
      "title": "Low-impact strength",
      "summary": "20 minutes of bodyweight or light bands supports mood without spiking cortisol when energy dips.",
      "phaseTag": "Luteal"
    },
    {
      "id": "3",
      "category": "rest",
      "title": "Sleep window consistency",
      "summary": "Aim for the same wake time ±45 minutes — progesterone can lighten sleep quality in late luteal.",
      "phaseTag": "Luteal"
    }
  ]
}

Make sure to generate:
1. One interesting "scientificInsight" starting with "Did you know?".
2. One action-oriented "dailyTip" with a concise title and details on how the partner can support them today.
3. Three highly specific "wellnessTips" (one category of nutrition, movement, rest, or mind per tip) matching this cycle phase or Any phase.
4.Don't answer questions outside menstrual health related questions
Return ONLY valid JSON. No markdown backticks, no wrapping other than the JSON object itself, no comments.`
    : `You are a helpful menstrual wellness and self-care assistant.
Given this user's own cycle context:
- Name: ${targetName}
- Cycle Phase: ${phaseLabel}
- Cycle Day: Day ${currentDay}
- Status: ${symptomsText}

Generate a highly personalized daily guidance JSON response matching exactly this format:
{
  "scientificInsight": "Did you know? Estrogen levels rise during the follicular phase and can increase cognitive clarity, mood, and physical stamina.",
  "dailyTip": {
    "title": "Support your energy",
    "desc": "Choose one realistic self-care action today, such as hydration, gentle movement, symptom logging, or earlier rest."
  },
  "wellnessTips": [
    {
      "id": "1",
      "category": "nutrition",
      "title": "Iron + vitamin C pairings",
      "summary": "Combine lentils or leafy greens with citrus or bell pepper to improve iron absorption during flow and early luteal.",
      "phaseTag": "Menstrual · Luteal"
    },
    {
      "id": "2",
      "category": "movement",
      "title": "Low-impact strength",
      "summary": "20 minutes of bodyweight or light bands supports mood without spiking cortisol when energy dips.",
      "phaseTag": "Luteal"
    },
    {
      "id": "3",
      "category": "rest",
      "title": "Sleep window consistency",
      "summary": "Aim for the same wake time ±45 minutes because progesterone can lighten sleep quality in late luteal.",
      "phaseTag": "Luteal"
    }
  ]
}

Make sure to generate:
1. One interesting "scientificInsight" starting with "Did you know?".
2. One action-oriented "dailyTip" written directly to the user using "you" and "your"; do not frame it as partner support.
3. Three highly specific "wellnessTips" (one category of nutrition, movement, rest, or mind per tip) matching this cycle phase or Any phase.
4. Don't answer questions outside menstrual health related questions.
Return ONLY valid JSON. No markdown backticks, no wrapping other than the JSON object itself, no comments.`;

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
        max_tokens: 800
      })
    });

    if (!response.ok) {
      try {
        await Dashboard.findOneAndUpdate(
          { userId: targetId },
          { 
            scientificInsight: defaultGuidance.scientificInsight,
            dailyTip: defaultGuidance.dailyTip,
            guidanceGeneratedDate: today,
            wellnessTips: defaultGuidance.wellnessTips
          },
          { upsert: true }
        );
      } catch (dbErr) {
        console.error('[Groq Guidance DB Save Error - bad API response]', dbErr);
      }
      return defaultGuidance;
    }

    const responseData = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    let content = responseData?.choices?.[0]?.message?.content?.trim() || '';

    // Strip out triple backticks if present
    content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && parsed.scientificInsight && parsed.dailyTip && Array.isArray(parsed.wellnessTips)) {
      try {
        await Dashboard.findOneAndUpdate(
          { userId: targetId },
          { 
            scientificInsight: parsed.scientificInsight,
            dailyTip: parsed.dailyTip,
            guidanceGeneratedDate: today,
            wellnessTips: parsed.wellnessTips
          },
          { upsert: true }
        );
      } catch (dbErr) {
        console.error('[Groq Guidance DB Save Error - success route]', dbErr);
      }
      return parsed;
    }

    try {
      await Dashboard.findOneAndUpdate(
        { userId: targetId },
        { 
          scientificInsight: defaultGuidance.scientificInsight,
          dailyTip: defaultGuidance.dailyTip,
          guidanceGeneratedDate: today,
          wellnessTips: defaultGuidance.wellnessTips
        },
        { upsert: true }
      );
    } catch (dbErr) {
      console.error('[Groq Guidance DB Save Error - invalid JSON payload]', dbErr);
    }
    return defaultGuidance;
  } catch (error) {
    console.error('[Groq Guidance Exception]', error);
    try {
      await Dashboard.findOneAndUpdate(
        { userId: targetId },
        { 
          scientificInsight: defaultGuidance.scientificInsight,
          dailyTip: defaultGuidance.dailyTip,
          guidanceGeneratedDate: today,
          wellnessTips: defaultGuidance.wellnessTips
        },
        { upsert: true }
      );
    } catch (dbErr) {
      console.error('[Groq Guidance DB Save Error - catch block]', dbErr);
    }
    return defaultGuidance;
  }
}
