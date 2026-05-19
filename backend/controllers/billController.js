import BillScan from '../models/BillScan.js';
import Transaction from '../models/Transaction.js';
import { computeSummary } from '../utils/summaryHelper.js';
import { extractTextFromImage, cleanupFile } from '../services/ocrService.js';
import { parseBillFromText } from '../services/billParseService.js';
import { parseReceiptWithLlm } from '../services/llmReceiptParser.js';

export const scanBill = async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a bill image or PDF');
  }

  const filePath = req.file.path;

  try {
    let ocrText = await extractTextFromImage(filePath);

    if (!ocrText || ocrText.trim().length < 5) {
      res.status(422);
      throw new Error(
        'Could not read text from this file. Try a clearer photo with good lighting.'
      );
    }

    let parsed = parseBillFromText(ocrText);
    let parserUsed = 'tesseract';

    const llmParsed = await parseReceiptWithLlm(ocrText);
    if (llmParsed) {
      parserUsed = 'llm+tesseract';
      if (llmParsed.vendorName && llmParsed.vendorName !== 'Receipt') {
        parsed.vendorName = llmParsed.vendorName;
        parsed.title = llmParsed.vendorName;
      }
      if ((!parsed.totalAmount || parsed.totalAmount <= 0) && llmParsed.totalAmount > 0) {
        parsed.totalAmount = llmParsed.totalAmount;
        parsed.amount = llmParsed.totalAmount;
        parsed.isDraft = false;
        parsed.missingFields = [];
      }
      if (llmParsed.category && llmParsed.category !== 'Other') {
        parsed.category = llmParsed.category;
        parsed.suggestedTransaction.category = llmParsed.category;
      }
    }

    parsed.suggestedTransaction = {
      title: parsed.vendorName || parsed.title,
      amount: parsed.totalAmount || parsed.amount || 0,
      category: parsed.category,
      type: parsed.type,
      date: parsed.date,
    };

    res.status(200).json({
      success: true,
      data: {
        ...parsed,
        parserUsed,
        rawTextPreview: ocrText.slice(0, 500),
      },
    });
  } finally {
    await cleanupFile(filePath);
  }
};

export const applyBillScan = async (req, res) => {
  const {
    transaction,
    fileName,
    fileType,
    fileSize,
    billCategory,
    billCategoryLabel,
    billCategoryIcon,
    confidence,
    extractedDetails,
    displayEntries,
    rawTextPreview,
    isDraft,
    missingFields,
    amountSource,
  } = req.body;

  if (!transaction?.title || !transaction?.type) {
    res.status(400);
    throw new Error('Transaction title and type are required');
  }

  const hasAmount = transaction.amount != null && transaction.amount > 0;
  const saveAsDraft = isDraft === true || !hasAmount;

  const summaryBefore = await computeSummary();

  let createdTransaction = null;

  if (!saveAsDraft) {
    createdTransaction = await Transaction.create({
      title: transaction.title,
      amount: transaction.amount,
      category: transaction.category || 'Other',
      type: transaction.type,
      date: transaction.date || new Date(),
      source: 'bill_scan',
    });
  }

  const billScan = await BillScan.create({
    fileName: fileName || 'uploaded-bill',
    fileType,
    fileSize,
    billCategory: billCategory || 'other',
    billCategoryLabel: billCategoryLabel || 'Bill',
    billCategoryIcon: billCategoryIcon || '📋',
    confidence: confidence || 'medium',
    status: saveAsDraft ? 'draft' : 'applied',
    missingFields: missingFields || (saveAsDraft ? ['amount'] : []),
    extractedDetails: {
      ...(extractedDetails || {}),
      vendor: transaction.title,
      category: transaction.category,
      date: transaction.date,
    },
    displayEntries: displayEntries || [],
    rawTextPreview: rawTextPreview || '',
    transactionId: createdTransaction?._id || null,
    amount: hasAmount ? transaction.amount : 0,
    transactionType: transaction.type,
    amountSource: amountSource || null,
  });

  const summaryAfter = await computeSummary();

  const impact = hasAmount && !saveAsDraft
    ? {
        amount: transaction.amount,
        type: transaction.type,
        balanceChange:
          transaction.type === 'income' ? transaction.amount : -transaction.amount,
        incomeChange: transaction.type === 'income' ? transaction.amount : 0,
        expenseChange: transaction.type === 'expense' ? transaction.amount : 0,
      }
    : null;

  res.status(201).json({
    success: true,
    data: {
      billScan,
      transaction: createdTransaction,
      summaryBefore,
      summaryAfter,
      impact,
      isDraft: saveAsDraft,
      missingFields: billScan.missingFields,
    },
  });
};

export const completeBillScan = async (req, res) => {
  const { amount } = req.body;
  const parsedAmount = parseFloat(amount);

  if (!parsedAmount || parsedAmount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid amount greater than zero');
  }

  const billScan = await BillScan.findById(req.params.id);

  if (!billScan) {
    res.status(404);
    throw new Error('Bill scan not found');
  }

  if (billScan.status !== 'draft') {
    res.status(400);
    throw new Error('This bill is already completed');
  }

  const summaryBefore = await computeSummary();

  const tx = await Transaction.create({
    title:
      billScan.extractedDetails?.vendor ||
      billScan.billCategoryLabel ||
      'Bill',
    amount: parsedAmount,
    category:
      billScan.extractedDetails?.category ||
      (billScan.transactionType === 'income' ? 'Salary' : 'Other'),
    type: billScan.transactionType,
    date: billScan.extractedDetails?.date || new Date(),
    source: 'bill_scan',
  });

  billScan.transactionId = tx._id;
  billScan.amount = parsedAmount;
  billScan.status = 'applied';
  billScan.missingFields = [];
  await billScan.save();

  const summaryAfter = await computeSummary();

  const impact = {
    amount: parsedAmount,
    type: billScan.transactionType,
    balanceChange:
      billScan.transactionType === 'income' ? parsedAmount : -parsedAmount,
    incomeChange: billScan.transactionType === 'income' ? parsedAmount : 0,
    expenseChange: billScan.transactionType === 'expense' ? parsedAmount : 0,
  };

  res.status(200).json({
    success: true,
    data: {
      billScan,
      transaction: tx,
      summaryBefore,
      summaryAfter,
      impact,
      isDraft: false,
    },
  });
};

export const getBillScans = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const scans = await BillScan.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('transactionId', 'title amount category type date');

  res.status(200).json({ success: true, data: scans });
};

export const undoBillScan = async (req, res) => {
  const billScan = await BillScan.findById(req.params.id);

  if (!billScan) {
    res.status(404);
    throw new Error('Bill scan not found');
  }

  const summaryBefore = await computeSummary();

  if (billScan.transactionId) {
    await Transaction.findByIdAndDelete(billScan.transactionId);
  }
  await BillScan.findByIdAndDelete(billScan._id);

  const summaryAfter = await computeSummary();

  res.status(200).json({
    success: true,
    message: billScan.status === 'draft' ? 'Draft bill removed' : 'Bill application undone',
    data: { summaryBefore, summaryAfter },
  });
};
