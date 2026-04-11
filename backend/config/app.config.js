export const PHOTO_UPLOAD_MAX_FILE_SIZE =
  Number(process.env.PHOTO_UPLOAD_MAX_FILE_SIZE || 10 * 1024 * 1024);

export const PHOTO_UPLOAD_MAX_BATCH_COUNT =
  Number(process.env.PHOTO_UPLOAD_MAX_BATCH_COUNT || 20);

export const PHOTO_BATCH_PROCESS_CONCURRENCY =
  Number(process.env.PHOTO_BATCH_PROCESS_CONCURRENCY || 3);

export const RATE_LIMIT_WINDOW_MS =
  Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);

export const RATE_LIMIT_MAX_SEARCH =
  Number(process.env.RATE_LIMIT_MAX_SEARCH || 30);

export const RATE_LIMIT_MAX_MUTATIONS =
  Number(process.env.RATE_LIMIT_MAX_MUTATIONS || 60);

export const AI_REQUEST_TIMEOUT_MS =
  Number(process.env.AI_REQUEST_TIMEOUT_MS || 30_000);

export const AI_REQUEST_MAX_RETRIES =
  Number(process.env.AI_REQUEST_MAX_RETRIES || 2);

export const AI_RETRY_BASE_DELAY_MS =
  Number(process.env.AI_RETRY_BASE_DELAY_MS || 750);
