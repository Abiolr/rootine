import Anthropic from '@anthropic-ai/sdk';
import { COACH_SYSTEM_PROMPT } from '../prompts/coach.prompt.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-5-5';
const MAX_TOKENS = 1024;
const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 4000;

const validateMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'messages must be a non-empty array';
  }
  if (messages.length > MAX_MESSAGES) {
    return `messages cannot exceed ${MAX_MESSAGES} entries`;
  }
  for (const m of messages) {
    if (!m || !['user', 'assistant'].includes(m.role)) {
      return "Each message must have a role of 'user' or 'assistant'";
    }
    if (typeof m.content !== 'string' || m.content.trim() === '') {
      return 'Each message must have non-empty string content';
    }
    if (m.content.length > MAX_MESSAGE_LENGTH) {
      return `Each message must be under ${MAX_MESSAGE_LENGTH} characters`;
    }
  }
  if (messages[0].role !== 'user') {
    return 'The first message must be from the user';
  }
  if (messages[messages.length - 1].role !== 'user') {
    return 'The last message must be from the user';
  }
  return null;
};

export const chat = async (req, res) => {
  try {
    const { messages } = req.body;

    const validationError = validateMessages(messages);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Only pass role/content through so clients can't inject extra fields
    const cleanMessages = messages.map(({ role, content }) => ({ role, content }));

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: COACH_SYSTEM_PROMPT,
      messages: cleanMessages
    });

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    res.status(200).json({ reply });
  } catch (error) {
    console.error('[Coach Controller] Chat Error:', error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return res.status(429).json({ error: 'Coach is busy right now. Please try again shortly.' });
      }
      return res.status(502).json({ error: 'Coach is temporarily unavailable' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};
