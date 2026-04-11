export const createHttpError = (status, message, code = 'REQUEST_ERROR', details = null) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.details = details;
  return err;
};

export const sendErrorResponse = (res, error, fallbackMessage = 'Request failed') => {
  const status = error?.status ?? 500;
  const message = error?.message || fallbackMessage;
  const code = error?.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  const payload = {
    error: message,
    code,
  };

  if (error?.details) {
    payload.details = error.details;
  }

  return res.status(status).json(payload);
};
