import { extractTotalAmount as extractTotalFromText } from './amountExtractor.js';

const BILL_CATEGORIES = {
  food: {
    label: 'Food & Dining',
    icon: '🍽️',
    keywords: [
      'restaurant', 'cafe', 'food', 'pizza', 'burger', 'menu', 'kitchen',
      'swiggy', 'zomato', 'grocery', 'mart', 'dining', 'meal', 'biryani',
      'calories', 'kcal', 'nutrition', 'protein', 'fat', 'carbs', 'dosa',
      'hotel', 'bakery', 'canteen',
    ],
  },
  electricity: {
    label: 'Electricity',
    icon: '⚡',
    keywords: [
      'electricity', 'electric', 'kwh', 'power', 'energy', 'meter',
      'discom', 'bescom', 'mseb', 'tneb', 'bill no', 'consumer no',
      'sanctioned load', 'tariff',
    ],
  },
  water: {
    label: 'Water',
    icon: '💧',
    keywords: ['water', 'jal', 'sewage', 'municipal', 'water supply'],
  },
  gas: {
    label: 'Gas / LPG',
    icon: '🔥',
    keywords: ['gas', 'lpg', 'cylinder', 'indane', 'hp gas', 'bharat gas'],
  },
  transport: {
    label: 'Transport & Fuel',
    icon: '🚗',
    keywords: [
      'petrol', 'diesel', 'fuel', 'pump', 'indian oil', 'hpcl', 'bpcl',
      'uber', 'ola', 'taxi', 'metro', 'toll', 'parking',
    ],
  },
  healthcare: {
    label: 'Healthcare',
    icon: '🏥',
    keywords: [
      'pharmacy', 'medical', 'hospital', 'clinic', 'medicine', 'doctor',
      'apollo', 'medplus', 'diagnostic', 'lab', 'health',
    ],
  },
  shopping: {
    label: 'Shopping',
    icon: '🛒',
    keywords: [
      'amazon', 'flipkart', 'mall', 'retail', 'store', 'fashion',
      'electronics', 'invoice', 'receipt', 'qty', 'quantity',
    ],
  },
  bills: {
    label: 'Bills & Subscriptions',
    icon: '📄',
    keywords: [
      'subscription', 'rent', 'insurance', 'premium', 'emi', 'loan',
      'broadband', 'wifi', 'mobile', 'recharge', 'postpaid', 'prepaid',
      'netflix', 'spotify',
    ],
  },
  income: {
    label: 'Salary & Income',
    icon: '💰',
    keywords: [
      'salary', 'payroll', 'payslip', 'wages', 'stipend', 'bonus',
      'net pay', 'gross pay', 'credited', 'credit salary', 'income',
      'employer', 'hr', 'compensation', 'remuneration', 'pay slip',
      'basic pay', 'hra', 'allowance',
    ],
  },
};

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1] ?? match[0];
      return typeof value === 'string' ? value.trim() : value;
    }
  }
  return null;
}

function parseNumber(str) {
  if (!str) return null;
  const cleaned = String(str).replace(/,/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function extractCommonFields(text) {
  const total = extractTotalFromText(text);

  return {
    vendor: firstMatch(text, [
      /(?:from|store|merchant|vendor)[:\s]+([A-Za-z0-9\s&.'-]{3,40})/i,
      /^([A-Z][A-Z0-9\s&.'-]{2,35})$/m,
    ]),
    date: firstMatch(text, [
      /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
    ]),
    invoiceNo: firstMatch(text, [
      /(?:invoice|bill|receipt)\s*(?:no|#)?[:\s]*([A-Z0-9/-]+)/i,
    ]),
    subtotal: parseNumber(firstMatch(text, [/sub\s*total[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i])),
    tax: parseNumber(firstMatch(text, [
      /(?:gst|tax|cgst|sgst|vat)[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ])),
    total,
    discount: parseNumber(firstMatch(text, [
      /(?:discount|savings?)[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ])),
  };
}

function extractFoodDetails(text) {
  return {
    calories: parseNumber(firstMatch(text, [
      /(\d+)\s*kcal/i,
      /calories?[:\s]*(\d+)/i,
      /energy[:\s]*(\d+)\s*kcal/i,
    ])),
    protein: parseNumber(firstMatch(text, [
      /protein[:\s]*(\d+\.?\d*)\s*g/i,
      /(\d+\.?\d*)\s*g\s*protein/i,
    ])),
    fat: parseNumber(firstMatch(text, [
      /(?:total\s*)?fat[:\s]*(\d+\.?\d*)\s*g/i,
      /(\d+\.?\d*)\s*g\s*fat/i,
    ])),
    carbs: parseNumber(firstMatch(text, [
      /carb(?:ohydrate)?s?[:\s]*(\d+\.?\d*)\s*g/i,
      /(\d+\.?\d*)\s*g\s*carbs?/i,
    ])),
    fiber: parseNumber(firstMatch(text, [/fiber[:\s]*(\d+\.?\d*)\s*g/i])),
    sugar: parseNumber(firstMatch(text, [/sugar[:\s]*(\d+\.?\d*)\s*g/i])),
    servingSize: firstMatch(text, [/serving\s*size[:\s]*([^\n]+)/i]),
    items: firstMatch(text, [/(\d+)\s*items?/i]),
  };
}

function extractUtilityDetails(text) {
  return {
    units: parseNumber(firstMatch(text, [
      /(?:units?|consumption|kwh)[:\s]*(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*(?:kwh|units?)/i,
    ])),
    currentReading: parseNumber(firstMatch(text, [
      /current\s*(?:reading|meter)[:\s]*(\d+\.?\d*)/i,
    ])),
    previousReading: parseNumber(firstMatch(text, [
      /previous\s*(?:reading|meter)[:\s]*(\d+\.?\d*)/i,
    ])),
    currentBill: parseNumber(firstMatch(text, [
      /current\s*(?:bill|charges?|amount)[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ])),
    previousBalance: parseNumber(firstMatch(text, [
      /previous\s*(?:balance|dues?)[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ])),
    savings: parseNumber(firstMatch(text, [
      /(?:savings?|saved|rebate|subsidy)[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ])),
    dueDate: firstMatch(text, [
      /due\s*date[:\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
      /pay\s*by[:\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
    ]),
    consumerNo: firstMatch(text, [
      /consumer\s*(?:no|id|number)[:\s]*([A-Z0-9/-]+)/i,
      /account\s*(?:no|number)[:\s]*([A-Z0-9/-]+)/i,
    ]),
    billingPeriod: firstMatch(text, [
      /billing\s*period[:\s]*([^\n]+)/i,
      /bill\s*period[:\s]*([^\n]+)/i,
    ]),
    tariff: firstMatch(text, [/tariff[:\s]*([^\n]+)/i]),
  };
}

function extractTransportDetails(text) {
  return {
    fuelLiters: parseNumber(firstMatch(text, [
      /(\d+\.?\d*)\s*(?:l|ltr|litre|liter)/i,
      /volume[:\s]*(\d+\.?\d*)/i,
    ])),
    ratePerLiter: parseNumber(firstMatch(text, [
      /(?:rate|price)[:\s]*(?:rs\.?|₹)?\s*([\d.]+)\s*\/?\s*l/i,
    ])),
    vehicleNo: firstMatch(text, [
      /(?:vehicle|reg)\s*(?:no)?[:\s]*([A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{1,4})/i,
    ]),
  };
}

function extractHealthcareDetails(text) {
  return {
    patientName: firstMatch(text, [/patient[:\s]*([A-Za-z\s]+)/i]),
    doctorName: firstMatch(text, [/doctor[:\s]*([A-Za-z.\s]+)/i]),
    medicines: firstMatch(text, [/(\d+)\s*medicines?/i]),
  };
}

function extractIncomeDetails(text) {
  return {
    employer: firstMatch(text, [
      /(?:employer|company|organization)[:\s]*([A-Za-z0-9\s&.'-]{3,40})/i,
    ]),
    payPeriod: firstMatch(text, [
      /(?:pay\s*period|salary\s*month|for\s*month)[:\s]*([^\n]+)/i,
    ]),
    basicPay: parseNumber(firstMatch(text, [/basic\s*pay[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i])),
    netPay: parseNumber(firstMatch(text, [
      /net\s*pay[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
      /net\s*salary[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ])),
    grossPay: parseNumber(firstMatch(text, [/gross\s*pay[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i])),
    deductions: parseNumber(firstMatch(text, [
      /(?:total\s*)?deductions?[:\s]*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ])),
    accountNo: firstMatch(text, [/account\s*(?:no|number)[:\s]*([A-Z0-9/-]+)/i]),
  };
}

function detectTransactionType(text, category) {
  if (category === 'income') return 'income';

  const lower = text.toLowerCase();
  const incomeSignals = [
    'salary credited', 'salary credit', 'payroll', 'payslip', 'net pay',
    'gross pay', 'wages paid', 'stipend', 'bonus credited', 'income credited',
    'amount credited', 'credit salary',
  ];
  const expenseSignals = ['debit', 'amount debited', 'paid to', 'payment to', 'dr '];

  const incomeScore = incomeSignals.filter((s) => lower.includes(s)).length;
  const expenseScore = expenseSignals.filter((s) => lower.includes(s)).length;

  if (incomeScore > expenseScore && incomeScore > 0) return 'income';
  return 'expense';
}

function classifyBill(text) {
  const lower = text.toLowerCase();
  const scores = {};

  for (const [key, config] of Object.entries(BILL_CATEGORIES)) {
    scores[key] = config.keywords.reduce(
      (sum, kw) => sum + (lower.includes(kw) ? 1 : 0),
      0
    );
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topKey, topScore] = sorted[0];

  if (topScore === 0) return 'other';
  return topKey;
}

function buildDetails(category, text, common) {
  const details = { ...common };

  switch (category) {
    case 'food':
      return { ...details, ...extractFoodDetails(text) };
    case 'electricity':
    case 'water':
    case 'gas':
      return { ...details, ...extractUtilityDetails(text) };
    case 'transport':
      return { ...details, ...extractTransportDetails(text) };
    case 'healthcare':
      return { ...details, ...extractHealthcareDetails(text) };
    case 'income':
      return { ...details, ...extractIncomeDetails(text) };
  }

  return details;
}

function formatDetailEntries(details, category) {
  const entries = [];
  const skip = new Set(['vendor', 'date']);

  const labels = {
    vendor: 'Vendor / Store',
    date: 'Date',
    invoiceNo: 'Invoice No',
    subtotal: 'Subtotal',
    tax: 'Tax / GST',
    total: 'Total Amount',
    discount: 'Discount / Savings',
    calories: 'Calories',
    protein: 'Protein (g)',
    fat: 'Fat (g)',
    carbs: 'Carbs (g)',
    fiber: 'Fiber (g)',
    sugar: 'Sugar (g)',
    servingSize: 'Serving Size',
    items: 'Items Count',
    units: 'Units Consumed',
    currentReading: 'Current Meter Reading',
    previousReading: 'Previous Meter Reading',
    currentBill: 'Current Bill (₹)',
    previousBalance: 'Previous Balance (₹)',
    savings: 'Savings (₹)',
    dueDate: 'Due Date',
    consumerNo: 'Consumer / Account No',
    billingPeriod: 'Billing Period',
    tariff: 'Tariff',
    fuelLiters: 'Fuel (Liters)',
    ratePerLiter: 'Rate per Liter (₹)',
    vehicleNo: 'Vehicle No',
    patientName: 'Patient Name',
    doctorName: 'Doctor',
    medicines: 'Medicines Count',
    employer: 'Employer',
    payPeriod: 'Pay Period',
    basicPay: 'Basic Pay (₹)',
    netPay: 'Net Pay (₹)',
    grossPay: 'Gross Pay (₹)',
    deductions: 'Deductions (₹)',
    accountNo: 'Account No',
  };

  const priority = {
    food: ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sugar', 'servingSize', 'items', 'total', 'tax', 'discount'],
    electricity: ['units', 'currentReading', 'previousReading', 'currentBill', 'savings', 'total', 'dueDate', 'consumerNo', 'billingPeriod', 'tariff'],
    water: ['units', 'currentBill', 'savings', 'total', 'dueDate', 'consumerNo'],
    gas: ['units', 'currentBill', 'total', 'dueDate', 'consumerNo'],
    transport: ['fuelLiters', 'ratePerLiter', 'vehicleNo', 'total', 'tax'],
    healthcare: ['patientName', 'doctorName', 'medicines', 'total', 'tax'],
    shopping: ['items', 'subtotal', 'tax', 'discount', 'total'],
    bills: ['invoiceNo', 'dueDate', 'total', 'discount'],
    income: ['employer', 'payPeriod', 'grossPay', 'basicPay', 'deductions', 'netPay', 'total'],
    other: ['vendor', 'date', 'invoiceNo', 'subtotal', 'tax', 'discount', 'total'],
  };

  const order = priority[category] || priority.other;

  for (const key of order) {
    const val = details[key];
    if (val != null && val !== '' && !skip.has(key)) {
      const currencyKeys = [
        'total', 'currentBill', 'savings', 'discount', 'subtotal', 'tax',
        'previousBalance', 'ratePerLiter', 'basicPay', 'netPay', 'grossPay', 'deductions',
      ];
      const formattedValue =
        typeof val === 'number' && currencyKeys.some((k) => key.includes(k))
          ? `₹${val.toLocaleString('en-IN')}`
          : val;

      entries.push({
        key,
        label: labels[key] || key,
        value: formattedValue,
      });
    }
  }

  if (details.vendor) {
    entries.unshift({ key: 'vendor', label: labels.vendor, value: details.vendor });
  }
  if (details.date) {
    entries.unshift({ key: 'date', label: labels.date, value: details.date });
  }

  return entries;
}

export function analyzeBillText(rawText) {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  const category = classifyBill(text);
  const config = BILL_CATEGORIES[category] || { label: 'General Expense', icon: '📋' };
  const common = extractCommonFields(text);
  const details = buildDetails(category, text, common);
  const entries = formatDetailEntries(details, category);

  let parsedDate = new Date().toISOString().split('T')[0];
  if (details.date) {
    const d = new Date(details.date);
    if (!Number.isNaN(d.getTime())) {
      parsedDate = d.toISOString().split('T')[0];
    }
  }

  const transactionType = detectTransactionType(text, category);
  const amount =
    details.total ||
    (transactionType === 'income' && (details.netPay || details.grossPay)) ||
    details.currentBill ||
    details.netPay ||
    extractTotalFromText(text) ||
    0;

  const missingFields = [];
  if (!amount || amount <= 0) missingFields.push('amount');

  const suggestedTransaction = {
    title:
      transactionType === 'income'
        ? details.employer || 'Salary / Income'
        : details.vendor || config.label,
    amount,
    category: mapCategoryToTransaction(category, transactionType),
    type: transactionType,
    date: parsedDate,
  };

  return {
    category,
    categoryLabel: config.label,
    categoryIcon: config.icon,
    confidence:
      missingFields.length > 0
        ? 'low'
        : entries.length > 2
          ? 'high'
          : entries.length > 0
            ? 'medium'
            : 'low',
    details,
    entries,
    suggestedTransaction,
    transactionType,
    isDraft: missingFields.length > 0,
    missingFields,
    rawTextPreview: text.slice(0, 500),
  };
}

function mapCategoryToTransaction(billCategory, transactionType) {
  if (transactionType === 'income') return 'Salary';

  const map = {
    food: 'Food',
    electricity: 'Bills',
    water: 'Bills',
    gas: 'Bills',
    transport: 'Transport',
    healthcare: 'Healthcare',
    shopping: 'Shopping',
    bills: 'Bills',
    income: 'Salary',
    other: 'Other',
  };
  return map[billCategory] || 'Other';
}

export { BILL_CATEGORIES };
