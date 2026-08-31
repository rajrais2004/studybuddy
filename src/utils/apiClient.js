/**
 * apiClient.js — Client-side API wrapper with retry logic and error mapping.
 *
 * Implements exponential backoff (max 2 retries) for transient network errors.
 * Maps HTTP error codes to specific, user-facing error messages so the UI
 * never shows a generic "something went wrong."
 */

/**
 * Maps HTTP status codes and error types to user-facing messages.
 * Each failure type gets its own distinct message.
 */
function mapErrorMessage(status, errorBody) {
  // If the server sent a structured error, use its message
  if (errorBody?.error) {
    return errorBody.error;
  }

  switch (status) {
    case 400:
      return 'Invalid input. Please check your notes and try again.';
    case 422:
      return 'The AI returned an incomplete response. Please try again.';
    case 429:
      return 'Too many requests. Please wait a moment before trying again.';
    case 502:
      return 'The AI service is temporarily unavailable. Please try again shortly.';
    case 504:
      return 'The request timed out. Please try again.';
    default:
      if (status >= 500) {
        return 'A server error occurred. Please try again later.';
      }
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Determines whether a failed request should be retried.
 * Only retries on network errors and 5xx status codes (excluding 504 timeout).
 */
function isRetryable(error, status) {
  // Network errors (fetch threw, no response)
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
  if (!status) return true; // No status means network-level failure

  // Server errors (except timeout — retrying won't help)
  return status >= 500 && status !== 504;
}

/**
 * Performs a fetch request with exponential backoff retry.
 *
 * @param {string} url       The API endpoint URL.
 * @param {object} options   Fetch options (method, headers, body, signal).
 * @param {number} maxRetries Maximum retry attempts (default 2).
 * @returns {Promise<object>} Parsed JSON response.
 * @throws {Error}           With a user-facing message property.
 */
async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastError;
  let lastStatus;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Exponential backoff: 0ms, 1000ms, 2000ms
      if (attempt > 0) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await fetch(url, options);

      // If the request was aborted, don't retry
      if (options.signal?.aborted) {
        const abortError = new Error('Request was cancelled.');
        abortError.isAborted = true;
        throw abortError;
      }

      if (response.ok) {
        return await response.json();
      }

      // Parse error body if possible
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = null;
      }

      lastStatus = response.status;
      lastError = new Error(mapErrorMessage(response.status, errorBody));
      lastError.status = response.status;
      lastError.type = errorBody?.type || 'UNKNOWN';

      // Only retry on transient failures
      if (!isRetryable(lastError, response.status) || attempt === maxRetries) {
        throw lastError;
      }
    } catch (err) {
      // Abort errors should propagate immediately, never retry
      if (err.name === 'AbortError' || err.isAborted) {
        const abortError = new Error('Request was cancelled.');
        abortError.isAborted = true;
        throw abortError;
      }

      // Network-level errors (no response at all)
      if (!err.status && err.name === 'TypeError') {
        lastError = new Error('Network error. Please check your connection and try again.');
        lastError.type = 'NETWORK';
        if (attempt === maxRetries) throw lastError;
        continue;
      }

      // Re-throw non-retryable errors
      if (err.status && !isRetryable(err, err.status)) {
        throw err;
      }

      lastError = err;
      if (attempt === maxRetries) throw lastError;
    }
  }

  throw lastError;
}

/**
 * Generate a study set from notes.
 * @param {string} notes    User's study notes.
 * @param {AbortSignal} signal  AbortController signal for cancellation.
 */
export async function generateStudySet(notes, signal) {
  return fetchWithRetry('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
    signal,
  });
}

/**
 * Refine an existing study set with a follow-up instruction.
 * @param {object} studySet       Current study set JSON.
 * @param {string} instruction    User's refinement instruction.
 * @param {AbortSignal} signal    AbortController signal for cancellation.
 */
export async function refineStudySet(studySet, instruction, signal) {
  return fetchWithRetry('/api/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studySet, instruction }),
    signal,
  });
}
