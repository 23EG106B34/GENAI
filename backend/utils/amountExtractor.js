/**
 * Multi-stage amount extraction with labeled regex fallbacks.
 * Returns { amount, source, confidence } — amount may be null.
 */

function parseNumber(str) {
  if (str == null) return null;
  const cleaned = String(str).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

const LABELED_PATTERNS = [
  { key: 'grand_total', regex: /(?:grand\s*)?total\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 10 },
  { key: 'total', regex: /\btotal\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 9 },
  { key: 'net_amount', regex: /\bnet\s*(?:amount|pay|total|amt)?\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 9 },
  { key: 'amount_due', regex: /\bamount\s*(?:due|payable|paid|to\s*pay)\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 8 },
  { key: 'balance_due', regex: /\bbalance\s*due\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 8 },
  { key: 'due', regex: /\bdue\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 7 },
  { key: 'payable', regex: /\b(?:payable|to\s*pay|you\s*pay)\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 7 },
  { key: 'net_pay', regex: /\bnet\s*pay\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 8 },
  { key: 'current_bill', regex: /\bcurrent\s*(?:bill|charges?|amount)\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 7 },
  { key: 'subtotal', regex: /\bsub\s*total\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi, weight: 4 },
];

function extractFromLabeledPatterns(text) {
  let best = null;

  for (const { key, regex, weight } of LABELED_PATTERNS) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const val = parseNumber(match[1]);
      if (!val) continue;
      if (!best || weight > best.weight || (weight === best.weight && val > best.amount)) {
        best = { amount: val, source: key, weight };
      }
    }
  }

  return best;
}

function extractFromLinePairs(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const keywords = /^(?:grand\s*)?total|net\s*(?:amount|pay)?|amount\s*due|balance\s*due|^\s*due\s*$/i;

  for (let i = 0; i < lines.length; i++) {
    if (!keywords.test(lines[i])) continue;

    const sameLine = lines[i].match(/([\d,]+\.\d{2}|\d{1,6}(?:,\d{3})*)/);
    if (sameLine) {
      const val = parseNumber(sameLine[1]);
      if (val) return { amount: val, source: 'line_label', weight: 8 };
    }

    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].match(/(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)/i);
      if (nextLine) {
        const val = parseNumber(nextLine[1]);
        if (val) return { amount: val, source: 'line_next', weight: 7 };
      }
    }
  }

  return null;
}

function extractCurrencyAmounts(text) {
  const amounts = [];
  const pattern = /(?:₹|rs\.?\s*|inr\s*)([\d,]+\.?\d*)/gi;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    const val = parseNumber(m[1]);
    if (val) amounts.push(val);
  }
  if (amounts.length) {
    return { amount: Math.max(...amounts), source: 'currency_symbol', weight: 5 };
  }
  return null;
}

function extractFinalNumericValue(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bottomHalf = lines.slice(Math.floor(lines.length / 2));
  const candidates = [];

  const scanLines = (lineList, weightBoost) => {
    for (const line of lineList) {
      if (/qty|quantity|phone|gstin|invoice\s*no|date\s*:/i.test(line)) continue;
      const matches = line.match(/(\d{1,6}(?:,\d{3})*(?:\.\d{2})?)/g) || [];
      for (const m of matches) {
        const val = parseNumber(m);
        if (val && val >= 1 && val < 5_000_000) {
          candidates.push({ amount: val, line, weightBoost });
        }
      }
    }
  };

  scanLines(bottomHalf, 2);
  scanLines(lines, 1);

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const scoreA = a.amount * a.weightBoost;
    const scoreB = b.amount * b.weightBoost;
    return scoreB - scoreA;
  });

  const pick = candidates[0];
  return {
    amount: pick.amount,
    source: 'final_numeric',
    weight: 3 + pick.weightBoost,
  };
}

export function extractTotalAmount(text) {
  if (!text?.trim()) {
    return { amount: null, source: null, confidence: 'none' };
  }

  const normalized = text.replace(/\r\n/g, '\n');

  const stages = [
    extractFromLabeledPatterns(normalized),
    extractFromLinePairs(normalized),
    extractCurrencyAmounts(normalized),
    extractFinalNumericValue(normalized),
  ].filter(Boolean);

  if (!stages.length) {
    return { amount: null, source: null, confidence: 'none' };
  }

  stages.sort((a, b) => b.weight - a.weight);
  const best = stages[0];

  let confidence = 'low';
  if (best.weight >= 8) confidence = 'high';
  else if (best.weight >= 5) confidence = 'medium';

  return {
    amount: best.amount,
    source: best.source,
    confidence,
  };
}
