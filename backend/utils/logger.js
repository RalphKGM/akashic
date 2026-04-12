const isProduction = process.env.NODE_ENV === 'production';

export const logDebug = (...args) => {
  if (!isProduction) {
    console.log(...args);
  }
};

export const logInfo = (...args) => {
  console.log(...args);
};

export const logWarn = (...args) => {
  console.warn(...args);
};

export const logError = (message, error = null) => {
  if (!error) {
    console.error(message);
    return;
  }

  if (isProduction) {
    console.error(message, error?.message || error);
    return;
  }

  console.error(message, error);
};
