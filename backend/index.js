import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import photo from './routes/photo.js';
import search from './routes/search.js';
import faces from './routes/faces.js';
import album from './routes/album.js';
import { sendErrorResponse } from './utils/http.js';
import {
  AI_REQUEST_TIMEOUT_MS,
  PHOTO_UPLOAD_MAX_BATCH_COUNT,
  RATE_LIMIT_MAX_MUTATIONS,
  RATE_LIMIT_MAX_SEARCH,
  RATE_LIMIT_WINDOW_MS,
} from './config/app.config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', photo);
app.use('/api', search);
app.use('/api', faces);
app.use('/api', album);

app.get('/', (req, res) => {
  res.json({ message: 'AI Photo Gallery API is running!' });
});

app.get('/healthz', (req, res) => {
  const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'].filter((key) => !process.env[key]);

  if (!process.env.GITHUB_MODELS_TOKEN && !process.env.GPT_TOKEN && !process.env.VECTOR_TOKEN) {
    missing.push('GITHUB_MODELS_TOKEN');
  }

  res.status(missing.length > 0 ? 503 : 200).json({
    status: missing.length > 0 ? 'degraded' : 'ok',
    missing,
    config: {
      aiRequestTimeoutMs: AI_REQUEST_TIMEOUT_MS,
      photoUploadMaxBatchCount: PHOTO_UPLOAD_MAX_BATCH_COUNT,
      rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,
      rateLimitMaxSearch: RATE_LIMIT_MAX_SEARCH,
      rateLimitMaxMutations: RATE_LIMIT_MAX_MUTATIONS,
    },
  });
});

app.use((err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  console.error('Unhandled request error:', err.message);
  sendErrorResponse(
    res,
    {
      status: err.status ?? 400,
      message: err.message || 'Invalid request',
      code: err.code || 'REQUEST_ERROR',
      details: err.details ?? null,
    },
    'Invalid request'
  );
});

app.use((req, res) => {
  sendErrorResponse(res, { status: 404, message: 'Route not found', code: 'ROUTE_NOT_FOUND' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
