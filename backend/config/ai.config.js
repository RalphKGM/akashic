import dotenv from "dotenv";

dotenv.config();

export const GITHUB_MODELS_API_URL =
  process.env.GITHUB_MODELS_API_URL || "https://models.github.ai/inference";

export const GITHUB_MODELS_TOKEN =
  process.env.GITHUB_MODELS_TOKEN ||
  process.env.GPT_TOKEN ||
  process.env.VECTOR_TOKEN ||
  "";

export const GITHUB_MODELS_CHAT_MODEL =
  process.env.GITHUB_MODELS_CHAT_MODEL || "openai/gpt-4.1-mini";

export const GITHUB_MODELS_EMBEDDING_MODEL =
  process.env.GITHUB_MODELS_EMBEDDING_MODEL || "openai/text-embedding-3-small";

export const GITHUB_MODELS_API_VERSION =
  process.env.GITHUB_MODELS_API_VERSION || "2022-11-28";

export const getGitHubModelsHeaders = (token = GITHUB_MODELS_TOKEN) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "X-GitHub-Api-Version": GITHUB_MODELS_API_VERSION,
});

export const assertGitHubModelsConfig = () => {
  if (!GITHUB_MODELS_TOKEN) {
    throw new Error("Missing GITHUB_MODELS_TOKEN");
  }
};
