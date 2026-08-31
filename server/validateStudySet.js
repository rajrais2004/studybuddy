/**
 * validateStudySet.js — Schema validation for the study set JSON.
 *
 * Validates parsed JSON against business rules:
 *   - topic is a non-empty string
 *   - flashcards array is non-empty, each card has non-empty front/back, valid difficulty
 *   - quiz array is non-empty, each question has 4 options, correctIndex in [0,3], non-empty explanation
 */

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

export function validateStudySet(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['The AI returned an empty or invalid response — try again.'] };
  }

  // --- Topic ---
  if (typeof data.topic !== 'string' || data.topic.trim().length === 0) {
    errors.push('Missing or empty topic in AI response.');
  }

  // --- Flashcards ---
  if (!Array.isArray(data.flashcards)) {
    errors.push('The AI returned no flashcards — try again with more detailed notes.');
  } else if (data.flashcards.length === 0) {
    errors.push('The AI returned an empty flashcard set — try again with more detailed notes.');
  } else {
    data.flashcards.forEach((card, i) => {
      if (!card.id || typeof card.id !== 'string') {
        errors.push(`Flashcard #${i + 1} is missing an ID.`);
      }
      if (!card.front || typeof card.front !== 'string' || card.front.trim().length === 0) {
        errors.push(`Flashcard #${i + 1} has an empty front side.`);
      }
      if (!card.back || typeof card.back !== 'string' || card.back.trim().length === 0) {
        errors.push(`Flashcard #${i + 1} has an empty back side.`);
      }
      if (!VALID_DIFFICULTIES.has(card.difficulty)) {
        card.difficulty = 'medium';
      }
    });
  }

  // --- Quiz ---
  if (!Array.isArray(data.quiz)) {
    errors.push('The AI returned no quiz questions — try again with more detailed notes.');
  } else if (data.quiz.length === 0) {
    errors.push('The AI returned an incomplete quiz — try again.');
  } else {
    data.quiz.forEach((q, i) => {
      if (!q.id || typeof q.id !== 'string') {
        errors.push(`Quiz question #${i + 1} is missing an ID.`);
      }
      if (!q.question || typeof q.question !== 'string' || q.question.trim().length === 0) {
        errors.push(`Quiz question #${i + 1} has no question text.`);
      }
      if (!Array.isArray(q.options)) {
        errors.push(`Quiz question #${i + 1} is missing answer options.`);
      } else if (q.options.length !== 4) {
        errors.push(`Quiz question #${i + 1} has ${q.options.length} options instead of 4.`);
      }
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
        errors.push(`Quiz question #${i + 1} has an invalid correct answer index (${q.correctIndex}).`);
      }
      if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
        errors.push(`Quiz question #${i + 1} is missing an explanation.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
