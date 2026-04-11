import {
  RATE_LIMIT_MAX_MUTATIONS,
  RATE_LIMIT_MAX_SEARCH,
  RATE_LIMIT_WINDOW_MS,
} from '../config/app.config.js';
import { sendErrorResponse } from '../utils/http.js';

const stores = new Map();

const getStore = (bucket) => {
  if (!stores.has(bucket)) {
    stores.set(bucket, new Map());
  }

  return stores.get(bucket);
};

const cleanupStore = (store, now) => {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
};

const getRequesterKey = (req) =>
  req.headers.authorization?.split(' ')[1] ||
  req.ip ||
  req.headers['x-forwarded-for'] ||
  'anonymous';

export const createRateLimit = ({
  bucket,
  maxRequests,
  windowMs = RATE_LIMIT_WINDOW_MS,
}) => {
  const store = getStore(bucket);

  return (req, res, next) => {
    const now = Date.now();
    cleanupStore(store, now);

    const key = getRequesterKey(req);
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      next();
      return;
    }

    if (current.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      sendErrorResponse(
        res,
        {
          status: 429,
          message: 'Too many requests. Please try again shortly.',
          code: 'RATE_LIMITED',
        },
        'Too many requests'
      );
      return;
    }

    current.count += 1;
    store.set(key, current);
    next();
  };
};

export const searchRateLimit = createRateLimit({
  bucket: 'search',
  maxRequests: RATE_LIMIT_MAX_SEARCH,
});

export const mutationRateLimit = createRateLimit({
  bucket: 'mutation',
  maxRequests: RATE_LIMIT_MAX_MUTATIONS,
});
