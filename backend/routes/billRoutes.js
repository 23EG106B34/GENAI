import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { receiptUpload } from '../middleware/upload.js';
import {
  scanBill,
  applyBillScan,
  completeBillScan,
  getBillScans,
  undoBillScan,
} from '../controllers/billController.js';

const router = express.Router();

router.post('/scan', receiptUpload.single('bill'), asyncHandler(scanBill));
router.post('/apply', asyncHandler(applyBillScan));
router.patch('/:id/complete', asyncHandler(completeBillScan));
router.get('/', asyncHandler(getBillScans));
router.delete('/:id', asyncHandler(undoBillScan));

export default router;