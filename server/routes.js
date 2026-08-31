/**
 * routes.js — Express API routes for generate and refine endpoints.
 */

import express from 'express';
import { generateStudySet, refineStudySet } from './geminiClient.js';
import { repairAndParse } from './jsonRepair.js';
import { validateStudySet } from './validateStudySet.js';

const router = express.Router();
const REQUEST_TIMEOUT_MS = 20000;

function withTimeout(promise, ms = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('TIMEOUT'));
    }, ms);

    promise
      .then((result) => { clearTimeout(timer); resolve(result); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

function classifyError(err) {
  const msg = err.message || '';

  if (msg === 'TIMEOUT') {
    return { status: 504, message: 'The AI took too long to respond (exceeded 20s timeout). Please try again.' };
  }

  if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
    return { status: 429, message: 'Rate limit reached. Please wait a moment and try again.' };
  }

  if (msg.includes('500') || msg.includes('503') || msg.includes('502')) {
    return { status: 502, message: 'The AI service is temporarily unavailable. Please try again shortly.' };
  }

  if (msg.includes('JSON repair failed') || msg.includes('Empty or non-string')) {
    return { status: 502, message: 'The AI returned an unreadable response. Please try again.' };
  }

  if (msg.includes('GEMINI_API_KEY')) {
    return { status: 500, message: 'Server configuration error. GEMINI_API_KEY is missing on the server.' };
  }

  return { status: 500, message: 'An unexpected error occurred on the server. Please try again.' };
}

router.post('/generate', async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || typeof notes !== 'string' || notes.trim().length < 10) {
      return res.status(400).json({
        error: 'Please provide at least 10 characters of study notes.',
        type: 'VALIDATION'
      });
    }

    const rawResponse = await withTimeout(generateStudySet(notes.trim()));
    const parsed = repairAndParse(rawResponse);
    const validation = validateStudySet(parsed);

    if (!validation.valid) {
      return res.status(422).json({
        error: validation.errors.join(' '),
        type: 'SCHEMA_VALIDATION',
        details: validation.errors
      });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('[/api/generate] Error:', err.message);
    const { status, message } = classifyError(err);
    return res.status(status).json({ error: message, type: 'SERVER' });
  }
});

router.post('/refine', async (req, res) => {
  try {
    const { studySet, instruction } = req.body;

    if (!studySet || typeof studySet !== 'object') {
      return res.status(400).json({
        error: 'Missing study set data.',
        type: 'VALIDATION'
      });
    }

    if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
      return res.status(400).json({
        error: 'Please provide a refinement instruction.',
        type: 'VALIDATION'
      });
    }

    const rawResponse = await withTimeout(refineStudySet(studySet, instruction.trim()));
    const parsed = repairAndParse(rawResponse);
    const validation = validateStudySet(parsed);

    if (!validation.valid) {
      return res.status(422).json({
        error: validation.errors.join(' '),
        type: 'SCHEMA_VALIDATION',
        details: validation.errors
      });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('[/api/refine] Error:', err.message);
    const { status, message } = classifyError(err);
    return res.status(status).json({ error: message, type: 'SERVER' });
  }
});

export default router;
