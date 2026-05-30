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
5. If the user asks general relationship or support questions, address them while relating it back to cycle dynamics if relevant.
6. CRITICAL: You must NOT ask any questions or engage in discussions about topics outside of general health, cycle tracking, cycle physiology, and supporting a partner through their menstrual cycle. If the user asks about unrelated topics (such as general news, sports, math, coding, generic cooking recipes, etc.), politely decline to discuss them and steer the conversation back to menstrual health, relationship support, or cycle symptoms. Under no circumstances should you initiate questions or ask the user questions about any topic outside of health or menstrual cycle tracking.`;

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

// ─── Data Extraction from Chat ────────────────────────────────────────────────

async function extractAndSaveCycleData(userId: string, text: string): Promise<void> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) return;

  try {
    const user = await User.findById(userId).lean();
    if (!user) return;
    const targetId = (user.role === 'partner' && user.partnerId) ? String(user.partnerId) : userId;

    const today = new Date().toISOString().split('T')[0];

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
   - Lifestyle: "life-sleep", "life-bbt", "life-sex", "life-pill"
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
      dashboardPatch.lastPeriodStart = extracted.lastPeriodStart;
    }
    if (extracted.typicalCycleDays && typeof extracted.typicalCycleDays === 'number' && extracted.typicalCycleDays >= 15 && extracted.typicalCycleDays <= 60) {
      dashboardPatch.typicalCycleDays = extracted.typicalCycleDays;
    }

    if (Object.keys(dashboardPatch).length > 0) {
      await Dashboard.findOneAndUpdate(
        { userId: new Types.ObjectId(targetId) },
        { $set: dashboardPatch },
        { upsert: true }
      );
      console.log(`[Chat Extractor] Updated Dashboard for user ${targetId}:`, dashboardPatch);
    }

    // 2. Update Symptom Log
    const symptomPatch: any = {};
    const logDoc = await SymptomLog.findOne({ userId: new Types.ObjectId(targetId), date: today }).lean();

    if (Array.isArray(extracted.symptoms) && extracted.symptoms.length > 0) {
      const validSymptoms = extracted.symptoms.filter((s: any) => typeof s === 'string');
      const existingSymptoms = logDoc?.symptoms || [];
      symptomPatch.symptoms = Array.from(new Set([...existingSymptoms, ...validSymptoms]));
    }

    if (extracted.water !== undefined && typeof extracted.water === 'number') {
      symptomPatch.water = extracted.water;
    }

    if (extracted.weight !== undefined && typeof extracted.weight === 'number') {
      symptomPatch.weight = Math.round(extracted.weight * 10) / 10;
    }

    if (Object.keys(symptomPatch).length > 0) {
      await SymptomLog.findOneAndUpdate(
        { userId: new Types.ObjectId(targetId), date: today },
        { $set: symptomPatch },
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

  const systemMessage = `You are MensFlow, a warm, highly empathetic, and supportive relationship assistant.
You help partners support their loved ones during their menstrual cycle.
Since this is a guest preview session, you do not have their custom cycle data yet.
Provide warm, general cycle support suggestions, tips, and insights.
Instructions:
1. Speak like a supportive relationship coach who understands cycle physiology.
2. Keep your answers concise, engaging, and easy to read (use markdown bullet points, bold text, or short paragraphs).
3. Encourage the user to sign up or create a free account to log symptoms, sync with their partner, and get personalized, daily advice.
4. CRITICAL: You must NOT ask any questions or engage in discussions about topics outside of general health, cycle tracking, cycle physiology, and supporting a partner through their menstrual cycle. If the user asks about unrelated topics (such as general news, sports, math, coding, generic cooking recipes, etc.), politely decline to discuss them and steer the conversation back to menstrual health, relationship support, or cycle symptoms. Under no circumstances should you initiate questions or ask the user questions about any topic outside of health or menstrual cycle tracking.`;

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
        temperature: 0.7
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
  const groqApiKey = process.env.GROQ_API_KEY;
  
  const defaultSuggestions = [
    "How can I support my partner with cramps today?",
    "What should I cook for dinner during her luteal phase?",
    "What are simple things to reduce her stress levels?"
  ];

  if (!groqApiKey) {
    return defaultSuggestions;
  }

  let phaseLabel = 'Menstrual';
  let currentDay = 1;
  let symptomsText = 'No symptoms logged today';
  let targetName = 'Partner';

  if (userId) {
    try {
      const user = await User.findById(userId).lean();
      let targetId = userId;
      if (user?.partnerId) {
        const partner = await User.findById(user.partnerId).lean();
        if (partner) {
          targetId = String(partner._id);
          targetName = partner.name;
        }
      }
      
      const dashboard = await Dashboard.findOne({ userId: targetId }).lean();
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
      const logDoc = await SymptomLog.findOne({ userId: targetId, date: today }).lean();
      const symptomsList = logDoc?.symptoms ?? [];
      if (symptomsList.length > 0) {
        symptomsText = `symptoms logged today: ${symptomsList.join(', ')}`;
      }
    } catch (err) {
      console.error('[Groq Suggestions Data Fetch Error]', err);
    }
  }

  const prompt = `You are a helpful assistant.
Given a relationship context where a partner wants to support their loved one (named ${targetName}):
- Cycle Phase: ${phaseLabel}
- Cycle Day: Day ${currentDay}
- Status: ${symptomsText}

Generate 3 short, relevant, and highly actionable question prompts (maximum 8 words each) that the partner can ask the AI to get support advice.
Return ONLY a valid JSON array of strings. Do not include markdown, bullet points, or explanation.
Example format:
["How can I help with her cramps?", "What should I cook for dinner?", "How to make her Luteal phase easier?"]`;

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
      return defaultSuggestions;
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
    
    return defaultSuggestions;
  } catch (error) {
    console.error('[Groq Suggestions Exception]', error);
    return defaultSuggestions;
  }
}

export async function getDailyGuidance(userId: string): Promise<any> {
  const groqApiKey = process.env.GROQ_API_KEY;

  const defaultGuidance = {
    scientificInsight: "Did you know? Estrogen levels rise, which stimulates the growth of follicles in your ovaries and can increase your cognitive clarity, mood, and physical stamina.",
    dailyTip: {
      title: "Embrace rising energy",
      desc: "Suggest starting a new creative project or outdoor activity together. Her body is highly responsive to learning and planning."
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
  let targetName = 'Partner';
  let targetId = userId;

  try {
    const user = await User.findById(userId).lean();
    if (user?.partnerId) {
      const partner = await User.findById(user.partnerId).lean();
      if (partner) {
        targetId = String(partner._id);
        targetName = partner.name;
      }
    }
    
    const dashboard = await Dashboard.findOne({ userId: targetId }).lean();
    if (dashboard && dashboard.guidanceGeneratedDate === today && dashboard.scientificInsight && dashboard.dailyTip) {
      return {
        scientificInsight: dashboard.scientificInsight,
        dailyTip: dashboard.dailyTip,
        wellnessTips: dashboard.wellnessTips && dashboard.wellnessTips.length > 0 ? dashboard.wellnessTips : defaultGuidance.wellnessTips
      };
    }

    if (dashboard?.lastPeriodStart) {
      const start = new Date(`${dashboard.lastPeriodStart}T12:00:00`);
      if (!isNaN(start.getTime())) {
        const diff = Math.floor((Date.now() - start.getTime()) / 86_400_000);
        const cycle = dashboard.typicalCycleDays || 28;
        currentDay = (((diff % cycle) + cycle) % cycle) + 1;
      }
      phaseLabel = dashboard.phaseLabel ?? 'Menstrual';
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

  const prompt = `You are a helpful wellness and partner support assistant.
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
