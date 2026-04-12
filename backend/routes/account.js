import express from 'express';
import { deleteAccountController } from '../controller/account.controller.js';
import { mutationRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

router.delete('/account', mutationRateLimit, deleteAccountController);

export default router;
