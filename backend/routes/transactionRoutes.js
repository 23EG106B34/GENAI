import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
} from '../controllers/transactionController.js';

const router = express.Router();

router.get('/summary', asyncHandler(getSummary));
router.route('/').get(asyncHandler(getTransactions)).post(asyncHandler(createTransaction));
router
  .route('/:id')
  .get(asyncHandler(getTransactionById))
  .put(asyncHandler(updateTransaction))
  .delete(asyncHandler(deleteTransaction));

export default router;
