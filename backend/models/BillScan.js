import mongoose from 'mongoose';

const billScanSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, trim: true },
    fileSize: { type: Number },
    billCategory: { type: String, required: true },
    billCategoryLabel: { type: String, required: true },
    billCategoryIcon: { type: String, default: '📋' },
    confidence: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: {
      type: String,
      enum: ['draft', 'applied'],
      default: 'applied',
    },
    missingFields: [{ type: String }],
    extractedDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    displayEntries: [
      {
        key: String,
        label: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    rawTextPreview: { type: String },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    amount: { type: Number, default: 0 },
    transactionType: { type: String, enum: ['income', 'expense'], required: true },
    amountSource: { type: String },
  },
  { timestamps: true }
);

const BillScan = mongoose.model('BillScan', billScanSchema);

export default BillScan;
