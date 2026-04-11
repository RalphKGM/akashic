import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import photo from './routes/photo.js';
import search from './routes/search.js';
import faces from './routes/faces.js';
import album from './routes/album.js';

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
  });
});

app.use((err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  console.error('Unhandled request error:', err.message);
  res.status(400).json({
    error: err.message || 'Invalid request',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
