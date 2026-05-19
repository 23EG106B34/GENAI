import { normalizeLlmResult } from './receiptParser.js';

export async function parseReceiptWithLlm(ocrText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You extract structured data from receipt OCR text. Return JSON only with keys: vendorName (string), totalAmount (number), category (one of: Salary, Freelance, Investments, Food, Transport, Shopping, Bills, Entertainment, Healthcare, Other), date (YYYY-MM-DD), type (income or expense), confidence (high, medium, or low).',
        },
        {
          role: 'user',
          content: `Extract receipt fields from this OCR text:\n\n${ocrText.slice(0, 4000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.warn('OpenAI receipt parse failed:', await response.text());
    return null;
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content);
  return normalizeLlmResult(parsed);
}
