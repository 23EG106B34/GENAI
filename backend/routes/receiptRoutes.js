import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { receiptUpload } from '../middleware/upload.js';
import { scanReceipt } from '../controllers/receiptController.js';

const router = express.Router();

router.post('/scan', receiptUpload.single('receipt'), asyncHandler(scanReceipt));

export default router;
