/**
 * geminiClient.js — Wraps Google Gemini API calls with structured JSON output.
 *
 * Uses responseMimeType + responseSchema to constrain the model at the API level.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.0-flash';

const STUDY_SET_SCHEMA = {
  type: 'object',
  properties: {
    topic: {
      type: 'string',
      description: 'A concise title for the study topic.'
    },
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:         { type: 'string', description: 'Unique identifier for this flashcard.' },
          front:      { type: 'string', description: 'The question or prompt on the front of the card.' },
          back:       { type: 'string', description: 'The answer or explanation on the back of the card.' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], description: 'Difficulty level.' }
        },
        required: ['id', 'front', 'back', 'difficulty']
      },
      description: 'Array of 8-12 flashcards covering the key concepts.'
    },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:           { type: 'string', description: 'Unique identifier for this quiz question.' },
          question:     { type: 'string', description: 'The quiz question.' },
          options:      {
            type: 'array',
            items: { type: 'string' },
            description: 'Exactly 4 answer options.'
          },
          correctIndex: { type: 'integer', description: 'Zero-based index of the correct option (0-3).' },
          explanation:  { type: 'string', description: 'Why the correct answer is correct.' }
        },
        required: ['id', 'question', 'options', 'correctIndex', 'explanation']
      },
      description: 'Array of 5-8 quiz questions with 4 options each.'
    }
  },
  required: ['topic', 'flashcards', 'quiz']
};

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: STUDY_SET_SCHEMA,
      temperature: 0.7,
    },
  });
}

export async function generateStudySet(notes) {
  const model = getModel();

  const prompt = `You are an expert educator. Based on the following study notes or topic, create a comprehensive study set.

Generate 8-12 flashcards that cover key concepts, terms, and facts. Each flashcard should have a clear question on the front and a concise but thorough answer on the back. Assign appropriate difficulty levels.

Generate 5-8 multiple-choice quiz questions to test understanding. Each question must have exactly 4 options with one correct answer. Provide a brief explanation of why the correct answer is right.

Study notes / topic:
${notes}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function refineStudySet(currentStudySet, instruction) {
  const model = getModel();

  const prompt = `You are an expert educator. You previously generated the following study set:

${JSON.stringify(currentStudySet, null, 2)}

The user wants you to modify it with this instruction: "${instruction}"

Apply the requested changes to the study set. You may add, remove, or modify flashcards and quiz questions as appropriate. Keep the overall structure intact. Return the complete updated study set.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
