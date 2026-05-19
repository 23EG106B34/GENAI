import { extractTotalAmount as extractAmount } from '../utils/amountExtractor.js';

const VALID_CATEGORIES = [
  'Salary', 'Freelance', 'Investments', 'Food', 'Transport',
  'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Other',
];

const KNOWN_VENDORS = [
  { pattern: /\bkfc\b/i, name: 'KFC', category: 'Food' },
  { pattern: /\bmcdonald/i, name: "McDonald's", category: 'Food' },
  { pattern: /\bburger\s*king\b/i, name: 'Burger King', category: 'Food' },
  { pattern: /\bsubway\b/i, name: 'Subway', category: 'Food' },
  { pattern: /\bdomino/i, name: "Domino's", category: 'Food' },
  { pattern: /\bpizza\s*hut\b/i, name: 'Pizza Hut', category: 'Food' },
  { pattern: /\bstarbucks\b/i, name: 'Starbucks', category: 'Food' },
  { pattern: /\bswiggy\b/i, name: 'Swiggy', category: 'Food' },
  { pattern: /\bzomato\b/i, name: 'Zomato', category: 'Food' },
  { pattern: /\bamazon\b/i, name: 'Amazon', category: 'Shopping' },
  { pattern: /\bflipkart\b/i, name: 'Flipkart', category: 'Shopping' },
  { pattern: /\buber\b/i, name: 'Uber', category: 'Transport' },
  { pattern: /\bola\b/i, name: 'Ola', category: 'Transport' },
  { pattern: /\bapollo\b/i, name: 'Apollo Pharmacy', category: 'Healthcare' },
  { pattern: /\bmedplus\b/i, name: 'MedPlus', category: 'Healthcare' },
];

const CATEGORY_KEYWORDS = {
  Food: ['restaurant', 'cafe', 'food', 'pizza', 'burger', 'meal', 'dining', 'kitchen', 'biryani', 'hotel', 'bakery'],
  Transport: ['petrol', 'diesel', 'fuel', 'pump', 'taxi', 'metro', 'toll', 'parking', 'transport'],
  Shopping: ['mall', 'retail', 'fashion', 'electronics', 'garment', 'store purchase'],
  Bills: ['electricity', 'water bill', 'gas bill', 'broadband', 'wifi', 'mobile bill', 'recharge', 'subscription'],
  Healthcare: ['pharmacy', 'medical', 'hospital', 'clinic', 'medicine', 'diagnostic'],
  Entertainment: ['netflix', 'spotify', 'cinema', 'movie', 'game'],
  Salary: ['salary', 'payroll', 'payslip', 'net pay', 'gross pay', 'wages'],
};

function parseNumber(str) {
  if (!str) return null;
  const num = parseFloat(String(str).replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

function extractKnownVendor(text) {
  for (const vendor of KNOWN_VENDORS) {
    if (vendor.pattern.test(text)) {
      return { vendorName: vendor.name, category: vendor.category };
    }
  }
  return null;
}

function extractVendorName(text) {
  const known = extractKnownVendor(text);
  if (known) return known.vendorName;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines.slice(0, 8)) {
    if (line.length < 3 || line.length > 40) continue;
    if (/^\d+[\d\s.,:/-]*$/.test(line)) continue;
    if (/^(total|subtotal|tax|gst|date|invoice|bill|receipt|qty)/i.test(line)) continue;
    if (/^[^a-zA-Z]{0,3}$/.test(line)) continue;
    const cleaned = line.replace(/[^a-zA-Z0-9\s&.'-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleaned.length >= 3 && /[a-zA-Z]/.test(cleaned)) {
      return cleaned.slice(0, 50);
    }
  }

  return 'Receipt';
}

function extractTotalAmount(text) {
  const { amount } = extractAmount(text);
  return amount;
}

function extractDate(text) {
  const patterns = [
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    let date;
    if (pattern === patterns[0]) {
      date = new Date(match[0]);
    } else if (pattern === patterns[2]) {
      date = new Date(match[0]);
    } else {
      const [, d, mo, y] = match;
      const year = y.length === 2 ? `20${y}` : y;
      date = new Date(`${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`);
    }

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return new Date().toISOString().split('T')[0];
}

function classifyCategory(text, knownVendor) {
  if (knownVendor?.category) return knownVendor.category;

  const lower = text.toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.filter((kw) => lower.includes(kw)).length;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [top, score] = sorted[0];

  if (score === 0) return 'Other';

  if (top === 'Bills' && scores.Bills < 2) {
    const foodScore = scores.Food || 0;
    if (foodScore >= 1) return 'Food';
    return 'Other';
  }

  return VALID_CATEGORIES.includes(top) ? top : 'Other';
}

function detectType(text, category) {
  if (category === 'Salary' || category === 'Freelance' || category === 'Investments') {
    return 'income';
  }
  const lower = text.toLowerCase();
  if (/(salary|payroll|payslip|net pay|credited|credit salary)/i.test(lower)) {
    return 'income';
  }
  return 'expense';
}

function computeConfidence({ vendorName, totalAmount, category }, knownVendor) {
  let score = 0;
  if (knownVendor) score += 2;
  if (vendorName && vendorName !== 'Receipt') score += 1;
  if (totalAmount && totalAmount > 0) score += 2;
  if (category && category !== 'Other') score += 1;

  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

export function parseReceiptText(rawText) {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  const knownVendor = extractKnownVendor(text);
  const vendorName = extractVendorName(text);
  const totalAmount = extractTotalAmount(text);
  const category = classifyCategory(text, knownVendor);
  const date = extractDate(text);
  const type = detectType(text, category);
  const confidence = computeConfidence({ vendorName, totalAmount, category }, knownVendor);

  return {
    vendorName,
    totalAmount: totalAmount || 0,
    category,
    date,
    type,
    confidence,
    title: vendorName,
    amount: totalAmount || 0,
  };
}

export function normalizeLlmResult(parsed) {
  const category = VALID_CATEGORIES.includes(parsed.category)
    ? parsed.category
    : 'Other';

  return {
    vendorName: parsed.vendorName || parsed.title || 'Receipt',
    totalAmount: parseNumber(parsed.totalAmount ?? parsed.amount) || 0,
    category,
    date: parsed.date || new Date().toISOString().split('T')[0],
    type: parsed.type === 'income' ? 'income' : 'expense',
    confidence: parsed.confidence || 'high',
    title: parsed.vendorName || parsed.title || 'Receipt',
    amount: parseNumber(parsed.totalAmount ?? parsed.amount) || 0,
  };
}
