import Groq from 'groq-sdk';
const GROQ_MODEL = 'openai/gpt-oss-120b';

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set.');
  }
  return new Groq({ apiKey });
}

const SYSTEM_PROMPT = `You are an expert educator. Always respond with ONLY valid JSON matching this exact shape, no markdown fences, no commentary:
{
  "topic": string,
  "flashcards": [{ "id": string, "front": string, "back": string, "difficulty": "easy"|"medium"|"hard" }],
  "quiz": [{ "id": string, "question": string, "options": [string,string,string,string], "correctIndex": number, "explanation": string }]
}
Generate 8-12 flashcards and 5-8 quiz questions.`;

export async function generateStudySet(notes) {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Study notes / topic:\n${notes}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });
  return completion.choices[0].message.content;
}

export async function refineStudySet(currentStudySet, instruction) {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Previous study set:\n${JSON.stringify(currentStudySet, null, 2)}\n\nInstruction: "${instruction}"\n\nReturn the complete updated study set as JSON.` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });
  return completion.choices[0].message.content;
}
