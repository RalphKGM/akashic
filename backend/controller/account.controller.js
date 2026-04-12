import { deleteAccount } from '../services/account.service.js';
import { getClientAuthToken, getUserFromToken } from '../utils/getClientAuthToken.js';
import { sendErrorResponse } from '../utils/http.js';
import { logError } from '../utils/logger.js';

export const deleteAccountController = async (req, res) => {
  try {
    const auth = getClientAuthToken(req, res);
    if (!auth) return;
    const { token } = auth;

    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await deleteAccount(user.id);
    res.status(200).json({
      message: 'Account deleted successfully',
      ...result,
    });
  } catch (error) {
    logError('Delete account error:', error);
    sendErrorResponse(res, error, 'Failed to delete account');
  }
};
