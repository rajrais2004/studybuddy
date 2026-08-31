/**
 * jsonRepair.js — Defense-in-depth JSON parsing layer.
 *
 * Even with Gemini's responseSchema / responseMimeType set to "application/json",
 * the model can occasionally wrap output in markdown fences, include trailing
 * commas, or produce other minor syntax issues.  This module attempts a series
 * of progressively aggressive repairs before giving up.
 */

export function stripMarkdownFences(raw) {
  return raw
    .replace(/^```(?:json|JSON)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
}

export function removeTrailingCommas(text) {
  return text.replace(/,\s*([}\]])/g, '$1');
}

export function escapeControlCharsInStrings(text) {
  return text.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
    return match
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  });
}

export function repairAndParse(raw) {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error('Empty or non-string response received from AI.');
  }

  let text = stripMarkdownFences(raw.trim());

  try {
    return JSON.parse(text);
  } catch (_firstAttempt) {
    // Continue to repairs
  }

  text = removeTrailingCommas(text);
  text = escapeControlCharsInStrings(text);

  try {
    return JSON.parse(text);
  } catch (secondAttempt) {
    const preview = raw.substring(0, 200);
    throw new Error(
      `JSON repair failed: ${secondAttempt.message}. ` +
      `Input preview: "${preview}${raw.length > 200 ? '…' : ''}"`
    );
  }
}
