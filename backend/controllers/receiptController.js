import { extractTextFromImage, cleanupFile } from '../services/ocrService.js';
import { parseReceiptText } from '../services/receiptParser.js';
import { parseReceiptWithLlm } from '../services/llmReceiptParser.js';

export const scanReceipt = async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a receipt image');
  }

  const filePath = req.file.path;
  let ocrText = '';

  try {
    ocrText = await extractTextFromImage(filePath);

    if (!ocrText || ocrText.trim().length < 5) {
      res.status(422);
      throw new Error(
        'Could not read text from this image. Try a clearer photo with good lighting.'
      );
    }

    let parsed = await parseReceiptWithLlm(ocrText);
    let parserUsed = 'llm';

    if (!parsed) {
      parsed = parseReceiptText(ocrText);
      parserUsed = 'tesseract';
    }

    res.status(200).json({
      success: true,
      data: {
        vendorName: parsed.vendorName,
        totalAmount: parsed.totalAmount,
        category: parsed.category,
        date: parsed.date,
        type: parsed.type,
        confidence: parsed.confidence,
        title: parsed.title || parsed.vendorName,
        amount: parsed.amount || parsed.totalAmount,
        parserUsed,
        rawTextPreview: ocrText.slice(0, 400),
      },
    });
  } finally {
    await cleanupFile(filePath);
  }
};
