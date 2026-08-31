/**
 * validateStudySet.js (client-side) — Lightweight schema check before rendering.
 *
 * Mirrors the server-side validation as defense-in-depth.
 * If the server somehow returns invalid data (or if the response is
 * manipulated in transit), this catches it before the UI tries to render
 * undefined properties.
 */

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

/**
 * @param {object} data  The study set object received from the API.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStudySet(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Received empty or invalid data from the server.'] };
  }

  if (typeof data.topic !== 'string' || data.topic.trim().length === 0) {
    errors.push('Missing topic in response.');
  }

  if (!Array.isArray(data.flashcards) || data.flashcards.length === 0) {
    errors.push('No flashcards were generated. Try again with more detailed notes.');
  } else {
    data.flashcards.forEach((card, i) => {
      if (!card.front?.trim() || !card.back?.trim()) {
        errors.push(`Flashcard #${i + 1} has missing content.`);
      }
      // Auto-fix invalid difficulty silently on client side
      if (!VALID_DIFFICULTIES.has(card.difficulty)) {
        card.difficulty = 'medium';
      }
    });
  }

  if (!Array.isArray(data.quiz) || data.quiz.length === 0) {
    errors.push('No quiz questions were generated. Try again with more detailed notes.');
  } else {
    data.quiz.forEach((q, i) => {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(`Quiz question #${i + 1} doesn't have exactly 4 options.`);
      }
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
        errors.push(`Quiz question #${i + 1} has an invalid correct answer.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
