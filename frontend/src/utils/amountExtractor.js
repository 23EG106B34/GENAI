/**
 * Client-side amount extraction (mirrors backend fallbacks).
 */

function parseNumber(str) {
  if (str == null) return null;
  const num = parseFloat(String(str).replace(/,/g, ''));
  return Number.isFinite(num) && num > 0 ? num : null;
}

const LABELED_PATTERNS = [
  /(?:grand\s*)?total\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi,
  /\bnet\s*(?:amount|pay|total)?\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi,
  /\bamount\s*(?:due|payable|paid)\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi,
  /\bbalance\s*due\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi,
  /\bdue\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi,
  /\b(?:payable|to\s*pay)\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/gi,
];

export function extractTotalAmount(text) {
  if (!text?.trim()) return null;

  for (const pattern of LABELED_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const val = parseNumber(match[1]);
      if (val) return val;
    }
  }

  const currency = /(?:₹|rs\.?|inr)\s*([\d,]+\.?\d*)/gi;
  const amounts = [];
  let m;
  while ((m = currency.exec(text)) !== null) {
    const val = parseNumber(m[1]);
    if (val) amounts.push(val);
  }
  if (amounts.length) return Math.max(...amounts);

  const lines = text.split('\n').filter(Boolean);
  const bottom = lines.slice(Math.floor(lines.length / 2));
  const nums = [];
  for (const line of bottom) {
    const matches = line.match(/(\d{1,6}(?:,\d{3})*(?:\.\d{2})?)/g) || [];
    for (const n of matches) {
      const val = parseNumber(n);
      if (val && val < 5_000_000) nums.push(val);
    }
  }
  return nums.length ? Math.max(...nums) : null;
}
