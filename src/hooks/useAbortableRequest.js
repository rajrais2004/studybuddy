/**
 * useAbortableRequest.js — Custom hook for stale-response protection.
 *
 * INTERVIEW TALKING POINT: This hook solves the "stale response" problem.
 * When a user clicks Generate, then clicks again before the first request
 * finishes, the first response could arrive after the second one and
 * overwrite it. This hook prevents that with two mechanisms:
 *
 *   1. AbortController: Each new request aborts the previous in-flight one,
 *      so the browser cancels the network request entirely.
 *
 *   2. Monotonically increasing request ID: Even if an old request somehow
 *      slips through (e.g., the abort didn't arrive in time), we compare
 *      the request ID at resolution time. If it doesn't match the latest
 *      ID, the result is silently discarded.
 *
 * The combination of both mechanisms makes stale-response rendering
 * virtually impossible.
 */

import { useState, useRef, useCallback } from 'react';

/**
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} asyncFn
 *   An async function that accepts an AbortSignal and returns a promise.
 *   The hook provides the signal; the caller provides the actual API call.
 *
 * @returns {{
 *   execute: (...args: any[]) => Promise<T | null>,
 *   abort: () => void,
 *   isLoading: boolean,
 *   error: Error | null,
 *   data: T | null,
 *   setData: (data: T | null) => void,
 *   elapsedMs: number
 * }}
 */
export function useAbortableRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Monotonically increasing request ID — incremented on every execute() call.
  // Stored in a ref so it persists across renders without causing re-renders.
  const requestIdRef = useRef(0);

  // Reference to the current AbortController so we can abort from outside.
  const controllerRef = useRef(null);

  // Timer ref for tracking elapsed time
  const timerRef = useRef(null);

  /**
   * Abort the current in-flight request, if any.
   * Safe to call multiple times — no-op if nothing is in flight.
   */
  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsLoading(false);
    setElapsedMs(0);
  }, []);

  /**
   * Execute an async API call with abort + stale-response protection.
   *
   * @param {(signal: AbortSignal) => Promise<T>} asyncFn
   *   The async function to execute. Receives an AbortSignal.
   *
   * @returns {Promise<T | null>}
   *   The result data, or null if the request was aborted/stale.
   */
  const execute = useCallback(async (asyncFn) => {
    // Step 1: Abort any previous in-flight request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Step 2: Increment the request ID — this is the "current" request now
    const thisRequestId = ++requestIdRef.current;

    // Step 3: Create a fresh AbortController for this request
    const controller = new AbortController();
    controllerRef.current = controller;

    // Step 4: Update UI state
    setIsLoading(true);
    setError(null);
    setElapsedMs(0);

    // Start elapsed time tracker (updates every 500ms)
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 500);

    try {
      // Step 5: Execute the async function, passing our abort signal
      const result = await asyncFn(controller.signal);

      // Step 6: STALE CHECK — if another request was started while we were
      // waiting, requestIdRef.current will have been incremented past our ID.
      // In that case, silently discard this result.
      if (requestIdRef.current !== thisRequestId) {
        return null; // Stale response — discard
      }

      // Step 7: This is the latest response — commit it to state
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      // Don't update state for aborted or stale requests
      if (err.isAborted || err.name === 'AbortError') {
        return null;
      }
      if (requestIdRef.current !== thisRequestId) {
        return null; // Stale error — discard
      }

      setError(err);
      return null;
    } finally {
      // Only clean up loading state if this is still the current request
      if (requestIdRef.current === thisRequestId) {
        setIsLoading(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setElapsedMs(0);
      }
    }
  }, []);

  return { execute, abort, isLoading, error, data, setData, elapsedMs };
}
