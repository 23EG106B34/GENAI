import Tesseract from 'tesseract.js';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/gif'];
const PDF_TYPE = 'application/pdf';

export function isImageFile(file) {
  return IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp|bmp|gif)$/i.test(file.name);
}

export function isPdfFile(file) {
  return file.type === PDF_TYPE || /\.pdf$/i.test(file.name);
}

export function isSupportedFile(file) {
  return isImageFile(file) || isPdfFile(file);
}

async function extractTextFromImage(file, onProgress) {
  const result = await Tesseract.recognize(file, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  return result.data.text;
}

async function extractTextFromPdf(file) {
  const pdfjs = await import('pdfjs-dist');
  const workerSrc = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc.default;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    pages.push(pageText);
  }

  return pages.join('\n');
}

export async function extractTextFromFile(file, onProgress) {
  if (isImageFile(file)) {
    return extractTextFromImage(file, onProgress);
  }

  if (isPdfFile(file)) {
    if (onProgress) onProgress(50);
    const text = await extractTextFromPdf(file);
    if (onProgress) onProgress(100);
    return text;
  }

  throw new Error('Unsupported file type. Please upload an image (JPG, PNG, WebP) or PDF.');
}

export function createFilePreviewUrl(file) {
  if (isImageFile(file)) {
    return URL.createObjectURL(file);
  }
  return null;
}
