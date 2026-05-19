import Tesseract from 'tesseract.js';
import fs from 'fs/promises';

export async function extractTextFromImage(filePath) {
  const result = await Tesseract.recognize(filePath, 'eng', {
    logger: () => {},
  });
  return result.data.text;
}

export async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore missing temp files
  }
}
