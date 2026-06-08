import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';
const TIMEOUT_MS = 120_000;

const groq = new Groq({
  apiKey: GROQ_API_KEY,
  timeout: TIMEOUT_MS,
});

/**
 * Core chat function with optional streaming and automatic fallback.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} [systemPrompt]
 * @param {boolean} [stream=false]
 * @returns {Promise<string> | AsyncGenerator<string>}
 */
export async function chatWithGroq(messages, systemPrompt = '', stream = false) {
  const builtMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  if (stream) {
    return streamWithFallback(builtMessages);
  }

  return completionWithFallback(builtMessages);
}

/**
 * Non-streaming completion with fallback to smaller model.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
async function completionWithFallback(messages) {
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        stream: false,
      });
      return response.choices[0]?.message?.content ?? '';
    } catch (err) {
      if (model === FALLBACK_MODEL) {
        throw new Error(`Groq chat failed on both models: ${err.message}`);
      }
      console.warn(`[groqChat] Primary model failed, falling back. Error: ${err.message}`);
    }
  }
}

/**
 * Streaming async generator with fallback to smaller model.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @returns {AsyncGenerator<string>}
 */
async function* streamWithFallback(messages) {
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const streamResponse = await groq.chat.completions.create({
        model,
        messages,
        stream: true,
      });

      for await (const chunk of streamResponse) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
      return;
    } catch (err) {
      if (model === FALLBACK_MODEL) {
        throw new Error(`Groq streaming failed on both models: ${err.message}`);
      }
      console.warn(`[groqChat] Primary model streaming failed, falling back. Error: ${err.message}`);
    }
  }
}

/**
 * Answer a question about the Torah/Bible in Hebrew.
 *
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function askAboutBible(question) {
  const systemPrompt =
    'אתה מומחה לתנ"ך, תורה ומקורות יהודיים. ענה תמיד בעברית בצורה ברורה ומפורטת. ' +
    'כלול פסוקים רלוונטיים, הקשר היסטורי ופרשנות מסורתית כשנדרש. ' +
    'אם השאלה אינה קשורה לתנ"ך או תורה, הסבר בנימוס שתחום ההתמחות שלך הוא מקורות יהודיים.';

  const messages = [{ role: 'user', content: question }];
  return completionWithFallback([{ role: 'system', content: systemPrompt }, ...messages]);
}

/**
 * Generate a structured summary and tag list from a debate conversation.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<{tags: string[], summary: string}>}
 */
export async function generateDebateSummary(messages) {
  const systemPrompt =
    'You are a debate analyst. Given a conversation, return a JSON object with exactly two fields: ' +
    '"tags" (an array of short keyword strings describing the main topics) and ' +
    '"summary" (a concise 2-4 sentence summary of the debate in the same language as the conversation). ' +
    'Respond with valid JSON only — no markdown, no code fences, no extra text.';

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const builtMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Here is the debate transcript:\n\n${transcript}` },
  ];

  let raw = '';
  try {
    raw = await completionWithFallback(builtMessages);
    const parsed = JSON.parse(raw);
    return {
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };
  } catch (err) {
    console.error('[groqChat] generateDebateSummary parse error:', err.message, 'Raw:', raw);
    return { tags: [], summary: raw };
  }
}

export default { chatWithGroq, askAboutBible, generateDebateSummary };
