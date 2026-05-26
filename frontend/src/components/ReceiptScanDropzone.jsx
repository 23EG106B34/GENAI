import { useRef, useState } from 'react';
import { extractTextFromFile } from '../utils/ocrService';
import { analyzeBillText } from '../utils/billAnalyzer';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp';

export default function ReceiptScanDropzone({ onScanComplete, onScanError }) {
  const inputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const processFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      onScanError?.('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onScanError?.('Image must be under 10 MB.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);
    onScanError?.(null);

    try {
      const ocrText = await extractTextFromFile(file);
      if (!ocrText || ocrText.trim().length < 5) {
        throw new Error(
          'Could not read text from this image. Try a clearer photo with good lighting.'
        );
      }

      const analysis = analyzeBillText(ocrText);
      const transaction = analysis.suggestedTransaction || {};

      onScanComplete?.({
        vendorName: transaction.title,
        totalAmount: transaction.amount || 0,
        category: transaction.category,
        date: transaction.date,
        type: transaction.type,
        confidence: analysis.confidence,
        title: transaction.title,
        amount: transaction.amount || 0,
        parserUsed: 'browser OCR',
        rawTextPreview: analysis.rawTextPreview,
      });
    } catch (err) {
      onScanError?.(err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="mb-5">
      <p className="text-sm font-medium text-slate-300 mb-2">Scan receipt (auto-fill form)</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !scanning && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition ${
          dragOver
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-500'
        } ${scanning ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            e.target.value = '';
          }}
        />

        {scanning ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white font-medium">Scanning receipt...</p>
            <p className="text-xs text-slate-500">OCR processing in your browser</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-16 h-16 rounded-lg object-cover border border-slate-600"
              />
            )}
            <div className="text-left">
              <p className="text-sm text-white font-medium">
                Drop receipt image or <span className="text-cyan-400">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Fills title, amount, category & date automatically
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
