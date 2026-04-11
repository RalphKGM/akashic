const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value) => UUID_RE.test(String(value || '').trim());

export const ensureUuid = (value, fieldName = 'ID') => {
  if (!isUuid(value)) {
    const err = new Error(`${fieldName} must be a valid UUID`);
    err.status = 400;
    throw err;
  }

  return value;
};

export const ensureNonEmptyString = (value, fieldName) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    const err = new Error(`${fieldName} is required`);
    err.status = 400;
    throw err;
  }

  return trimmed;
};

export const ensureArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    const err = new Error(`${fieldName} must be an array`);
    err.status = 400;
    throw err;
  }

  return value;
};
