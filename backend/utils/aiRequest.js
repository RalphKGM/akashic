export const RETRYABLE_AI_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export const isAbortError = (error) =>
  error?.name === 'AbortError' || error?.code === 'ABORT_ERR';

export const isRetryableAiError = (error) => {
  if (!error) return false;
  if (isAbortError(error)) return true;
  if (RETRYABLE_AI_STATUS_CODES.has(Number(error.status))) return true;
  if (error?.name === 'TypeError') return true;
  return false;
};

export const getAiRetryDelayMs = (attempt, baseDelayMs) =>
  baseDelayMs * Math.pow(2, attempt);

export const normalizeAiRequestError = (error, timeoutMs) => {
  if (!isAbortError(error)) return error;

  const timeoutError = new Error(`GitHub Models request timed out after ${timeoutMs}ms`);
  timeoutError.status = 504;
  timeoutError.code = 'AI_REQUEST_TIMEOUT';
  return timeoutError;
};
