export const VALID_CATEGORIES = ['food', 'nature', 'animals', 'people', 'travel'];

export const extractSection = (content, label, nextLabels) => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedNextLabels = nextLabels.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const endPattern =
    escapedNextLabels.length > 0 ? `(?=\\[(?:${escapedNextLabels.join('|')})\\]|$)` : '$';
  const regex = new RegExp(`\\[${escapedLabel}\\]\\s*([\\s\\S]*?)\\s*${endPattern}`, 'i');
  const match = content.match(regex);
  return match?.[1]?.trim() ?? '';
};

export const normalizeCategory = (rawCategory) => {
  if (!rawCategory) return null;

  const values = rawCategory
    .toLowerCase()
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return VALID_CATEGORIES.find((value) => values.includes(value)) ?? null;
};

export const parsePhotoDescription = (description) => ({
  literal: extractSection(description, 'LITERAL', ['DESCRIPTIVE', 'TAGS', 'CATEGORY']),
  descriptive: extractSection(description, 'DESCRIPTIVE', ['TAGS', 'CATEGORY']),
  tags: extractSection(description, 'TAGS', ['CATEGORY']).toLowerCase(),
  category: normalizeCategory(extractSection(description, 'CATEGORY', [])),
});
