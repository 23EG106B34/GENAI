import { extractTotalAmount } from '../utils/amountExtractor.js';
import { parseReceiptText } from './receiptParser.js';

const BILL_CATEGORY_MAP = {
  food: { label: 'Food & Dining', icon: '🍽️', txCategory: 'Food' },
  electricity: { label: 'Electricity', icon: '⚡', txCategory: 'Bills' },
  water: { label: 'Water', icon: '💧', txCategory: 'Bills' },
  gas: { label: 'Gas / LPG', icon: '🔥', txCategory: 'Bills' },
  transport: { label: 'Transport & Fuel', icon: '🚗', txCategory: 'Transport' },
  healthcare: { label: 'Healthcare', icon: '🏥', txCategory: 'Healthcare' },
  shopping: { label: 'Shopping', icon: '🛒', txCategory: 'Shopping' },
  bills: { label: 'Bills & Subscriptions', icon: '📄', txCategory: 'Bills' },
  income: { label: 'Salary & Income', icon: '💰', txCategory: 'Salary' },
  other: { label: 'General Expense', icon: '📋', txCategory: 'Other' },
};

const BILL_KEYWORDS = {
  food: ['restaurant', 'cafe', 'food', 'pizza', 'burger', 'kfc', 'mcdonald', 'swiggy', 'zomato', 'dining', 'meal'],
  electricity: ['electricity', 'kwh', 'discom', 'bescom', 'power bill', 'energy charges'],
  water: ['water bill', 'jal', 'sewage', 'water supply'],
  gas: ['lpg', 'gas cylinder', 'indane', 'hp gas'],
  transport: ['petrol', 'diesel', 'fuel', 'uber', 'ola', 'parking'],
  healthcare: ['pharmacy', 'hospital', 'clinic', 'medicine', 'apollo', 'medplus'],
  shopping: ['amazon', 'flipkart', 'mall', 'retail', 'shopping'],
  bills: ['subscription', 'broadband', 'wifi', 'recharge', 'rent', 'insurance'],
  income: ['salary', 'payroll', 'payslip', 'net pay', 'gross pay', 'wages', 'credited'],
};

function classifyBillCategory(text) {
  const lower = text.toLowerCase();
  const scores = {};

  for (const [key, words] of Object.entries(BILL_KEYWORDS)) {
    scores[key] = words.filter((w) => lower.includes(w)).length;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [top, score] = sorted[0];
  return score > 0 ? top : 'other';
}

function buildDisplayEntries(base, amountMeta) {
  const entries = [];
  if (base.vendorName) entries.push({ key: 'vendor', label: 'Vendor / Store', value: base.vendorName });
  if (base.date) entries.push({ key: 'date', label: 'Date', value: base.date });
  if (amountMeta.amount) {
    entries.push({
      key: 'total',
      label: 'Total Amount',
      value: `₹${amountMeta.amount.toLocaleString('en-IN')}`,
    });
    entries.push({
      key: 'amountSource',
      label: 'Amount detected via',
      value: amountMeta.source,
    });
  }
  return entries;
}

export function parseBillFromText(rawText) {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  const receipt = parseReceiptText(text);
  const amountMeta = extractTotalAmount(text);

  const amount = amountMeta.amount ?? receipt.totalAmount ?? null;
  const billCategory = classifyBillCategory(text);
  const config = BILL_CATEGORY_MAP[billCategory] || BILL_CATEGORY_MAP.other;

  const transactionType =
    billCategory === 'income' || receipt.type === 'income' ? 'income' : 'expense';

  const missingFields = [];
  if (!amount || amount <= 0) missingFields.push('amount');

  const overallConfidence =
    missingFields.length === 0
      ? amountMeta.confidence === 'high' || receipt.confidence === 'high'
        ? 'high'
        : 'medium'
      : 'low';

  const suggestedTransaction = {
    title: receipt.vendorName || config.label,
    amount: amount || 0,
    category: config.txCategory,
    type: transactionType,
    date: receipt.date,
  };

  return {
    vendorName: receipt.vendorName,
    totalAmount: amount || 0,
    category: config.txCategory,
    billCategory,
    billCategoryLabel: config.label,
    billCategoryIcon: config.icon,
    date: receipt.date,
    type: transactionType,
    confidence: overallConfidence,
    amountSource: amountMeta.source,
    amountConfidence: amountMeta.confidence,
    isDraft: missingFields.length > 0,
    missingFields,
    title: receipt.vendorName || config.label,
    amount: amount || 0,
    suggestedTransaction,
    extractedDetails: {
      vendor: receipt.vendorName,
      date: receipt.date,
      total: amount,
      amountSource: amountMeta.source,
    },
    displayEntries: buildDisplayEntries(receipt, amountMeta),
    rawTextPreview: text.slice(0, 500),
  };
}
