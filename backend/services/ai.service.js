import dotenv from 'dotenv';
import {
  assertGitHubModelsConfig,
  GITHUB_MODELS_API_URL,
  GITHUB_MODELS_CHAT_MODEL,
  GITHUB_MODELS_EMBEDDING_MODEL,
  getGitHubModelsHeaders,
} from '../config/ai.config.js';
import {
  AI_REQUEST_MAX_RETRIES,
  AI_REQUEST_TIMEOUT_MS,
  AI_RETRY_BASE_DELAY_MS,
} from '../config/app.config.js';
import {
  getAiRetryDelayMs,
  isRetryableAiError,
  normalizeAiRequestError,
} from '../utils/aiRequest.js';
import { logDebug, logWarn } from '../utils/logger.js';

dotenv.config();

const IMAGE_PROMPT = `
You are an expert image analysis assistant with deep knowledge of Filipino cuisine, games, anime, films, landmarks, nature, and pop culture.
Analyze the image and produce FOUR separate sections. If the image is low resolution or unclear, do your best to describe what you can see.

RULES:
- Do NOT repeat information across sections
- Be specific and accurate
- Use complete sentences for descriptions
- Use comma-separated keywords for tags
- Return exactly one category from: food, nature, animals, people, travel
- If none fit clearly, return "none"

FORMAT:
[LITERAL]
<2-3 sentences describing exactly what you see>

[DESCRIPTIVE]
<2-3 sentences describing context, setting, mood, or significance>

[TAGS]
<comma-separated keywords>

[CATEGORY]
<exactly one value: food, nature, animals, people, travel, or none>
`;

const parseResponse = async (response) => {
  const raw = await response.text();

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildGitHubModelsError = (payload, path, status) => {
  const message =
    payload?.error?.message ||
    payload?.message ||
    payload?.raw ||
    `GitHub Models request failed with status ${status}`;

  const err = new Error(message);
  err.status = status;
  err.code = 'GITHUB_MODELS_REQUEST_FAILED';
  err.path = path;
  return err;
};

const requestGitHubModels = async (
  path,
  body,
  { retries = AI_REQUEST_MAX_RETRIES, timeoutMs = AI_REQUEST_TIMEOUT_MS } = {}
) => {
  assertGitHubModelsConfig();

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${GITHUB_MODELS_API_URL}${path}`, {
        method: 'POST',
        headers: getGitHubModelsHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = await parseResponse(response);
      if (!response.ok) {
        throw buildGitHubModelsError(payload, path, response.status);
      }

      return payload;
    } catch (error) {
      const normalizedError = normalizeAiRequestError(error, timeoutMs);

      if (attempt < retries && isRetryableAiError(normalizedError)) {
        const delay = getAiRetryDelayMs(attempt, AI_RETRY_BASE_DELAY_MS);
        logWarn(
          `GitHub Models ${path} failed (${normalizedError.message}); retrying in ${delay}ms`
        );
        await sleep(delay);
        continue;
      }

      throw normalizedError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error('GitHub Models request failed after retries');
};

export const chatCompletionText = async ({ messages, maxTokens = 300, temperature = 0.2 }) => {
  const payload = await requestGitHubModels('/chat/completions', {
    model: GITHUB_MODELS_CHAT_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
  });

  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('Empty response from GitHub Models');
  }

  return content;
};

export const generateEmbedding = async (text) => {
  const start = Date.now();

  try {
    const payload = await requestGitHubModels('/embeddings', {
      model: GITHUB_MODELS_EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    });

    const embedding = payload?.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) {
      throw new Error('GitHub Models returned an invalid embedding payload');
    }

    logDebug(`generateEmbedding: completed in ${Date.now() - start}ms`);
    return embedding;
  } catch (error) {
    throw new Error(error.message || 'Embedding failed');
  }
};

export const describeImage = async (imageBuffer) => {
  const start = Date.now();
  logDebug('describeImage: sending request to GitHub Models...');

  try {
    const content = await chatCompletionText({
      messages: [
        {
          role: 'system',
          content: IMAGE_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      maxTokens: 600,
      temperature: 0.1,
    });

    logDebug(`describeImage: completed in ${Date.now() - start}ms`);
    return content;
  } catch (error) {
    if (error.status === 429) {
      throw new Error('Image analysis rate limit hit - try again shortly');
    }

    throw new Error(error.message || 'Image description failed');
  }
};
