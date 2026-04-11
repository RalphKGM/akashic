import dotenv from 'dotenv';
import {
  assertGitHubModelsConfig,
  GITHUB_MODELS_API_URL,
  GITHUB_MODELS_CHAT_MODEL,
  GITHUB_MODELS_EMBEDDING_MODEL,
  getGitHubModelsHeaders,
} from '../config/ai.config.js';

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

const requestGitHubModels = async (path, body) => {
  assertGitHubModelsConfig();

  const response = await fetch(`${GITHUB_MODELS_API_URL}${path}`, {
    method: 'POST',
    headers: getGitHubModelsHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      payload?.raw ||
      `GitHub Models request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return payload;
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

export const generateEmbedding = async (text, retries = 3) => {
  const start = Date.now();

  for (let attempt = 0; attempt <= retries; attempt += 1) {
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

      console.log(`generateEmbedding: completed in ${Date.now() - start}ms`);
      return embedding;
    } catch (error) {
      if (error.status === 429 && attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt);
        console.warn(
          `generateEmbedding: rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(error.message || 'Embedding failed');
    }
  }

  throw new Error('Embedding failed after retries');
};

export const describeImage = async (imageBuffer) => {
  const start = Date.now();
  console.log('describeImage: sending request to GitHub Models...');

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

    console.log(`describeImage: completed in ${Date.now() - start}ms`);
    return content;
  } catch (error) {
    if (error.status === 429) {
      throw new Error('Image analysis rate limit hit - try again shortly');
    }

    throw new Error(error.message || 'Image description failed');
  }
};
