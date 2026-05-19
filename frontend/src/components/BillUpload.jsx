import { useCallback, useRef, useState } from 'react';
import { scanBill, applyBillScan, completeBillScan } from '../api/bills';
import { createFilePreviewUrl, isSupportedFile } from '../utils/ocrService';
import BillAnalysisResult from './BillAnalysisResult';
import AppliedBillCard from './AppliedBillCard';
import DraftBillCard from './DraftBillCard';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,application/pdf';

function buildApplyPayload(parsed, file) {
  return {
    transaction: parsed.suggestedTransaction || {
      title: parsed.title || parsed.vendorName,
      amount: parsed.amount || parsed.totalAmount || 0,
      category: parsed.category,
      type: parsed.type,
      date: parsed.date,
    },
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    billCategory: parsed.billCategory || parsed.category,
    billCategoryLabel: parsed.billCategoryLabel,
    billCategoryIcon: parsed.billCategoryIcon,
    confidence: parsed.confidence,
    extractedDetails: parsed.extractedDetails,
    displayEntries: parsed.displayEntries,
    rawTextPreview: parsed.rawTextPreview,
    isDraft: parsed.isDraft,
    missingFields: parsed.missingFields,
    amountSource: parsed.amountSource,
  };
}

function toAnalysisShape(parsed) {
  return {
    category: parsed.billCategory || 'other',
    categoryLabel: parsed.billCategoryLabel || 'Bill',
    categoryIcon: parsed.billCategoryIcon || '📋',
    confidence: parsed.confidence,
    details: parsed.extractedDetails || {},
    entries: parsed.displayEntries || [],
    suggestedTransaction: parsed.suggestedTransaction,
    transactionType: parsed.type,
    isDraft: parsed.isDraft,
    missingFields: parsed.missingFields,
    rawTextPreview: parsed.rawTextPreview,
  };
}

export default function BillUpload({ onApplyBill, onCompleteBill, onUndoBill }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [applied, setApplied] = useState(null);
  const [draft, setDraft] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [undoing, setUndoing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAnalysis(null);
    setApplied(null);
    setDraft(null);
    setError(null);
    setInfo(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [previewUrl]);

  const saveBill = useCallback(
    async (parsed, file, preview) => {
      const applyFn = onApplyBill || applyBillScan;
      const payload = buildApplyPayload(parsed, file);
      const res = await applyFn(payload);
      const data = res.data ?? res;

      const analysisShape = toAnalysisShape(parsed);

      if (data.isDraft) {
        setDraft({ ...data, analysis: analysisShape, previewUrl: preview });
        setApplied(null);
        setInfo(
          'Bill saved as draft. Vendor and type detected — please enter the amount below.'
        );
      } else {
        setApplied({ ...data, analysis: analysisShape, previewUrl: preview });
        setDraft(null);
        setInfo('Bill applied and totals updated.');
      }

      setAnalysis(analysisShape);
    },
    [onApplyBill]
  );

  const processFile = useCallback(
    async (selectedFile) => {
      if (!isSupportedFile(selectedFile)) {
        setError('Please upload an image (JPG, PNG, WebP) or PDF file.');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be under 10 MB.');
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setAnalysis(null);
      setApplied(null);
      setDraft(null);
      setScanning(true);
      setApplying(false);
      setError(null);
      setInfo(null);

      const preview = createFilePreviewUrl(selectedFile);
      if (preview) setPreviewUrl(preview);

      try {
        const scanRes = await scanBill(selectedFile);
        const parsed = scanRes.data;

        setApplying(true);
        await saveBill(parsed, selectedFile, preview);
      } catch (err) {
        setError(err.message || 'Failed to process the bill.');
      } finally {
        setScanning(false);
        setApplying(false);
      }
    },
    [previewUrl, saveBill]
  );

  const handleCompleteDraft = async (billScanId, amount) => {
    setCompleting(true);
    setError(null);
    try {
      const completeFn = onCompleteBill || completeBillScan;
      const res = await completeFn(billScanId, amount);
      const data = res.data ?? res;

      setDraft(null);
      setApplied({
        ...data,
        analysis,
        previewUrl,
      });
      setInfo('Amount added — bill completed and totals updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleUndo = async (billScanId) => {
    if (!onUndoBill) return;
    setUndoing(true);
    try {
      await onUndoBill(billScanId);
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setUndoing(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const busy = scanning || applying || completing;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Upload Bill / Receipt</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Server OCR with smart fallbacks · saves draft if amount is missing
          </p>
        </div>
        {(analysis || applied || draft) && (
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="text-sm text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !busy && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
          dragOver
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
        } ${busy ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mx-auto w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {scanning ? (
          <div>
            <div className="mx-auto w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-white font-medium">Scanning on server (OCR)...</p>
          </div>
        ) : applying ? (
          <p className="text-white font-medium">Saving extracted details...</p>
        ) : (
          <>
            <p className="text-white font-medium">
              Drop your bill here or <span className="text-cyan-400">browse files</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Detects Total · Net · Due · or final amount automatically
            </p>
          </>
        )}
      </div>

      {info && (
        <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          {info}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {draft && (
        <div className="mt-6">
          <DraftBillCard
            draft={draft}
            previewUrl={draft.previewUrl || previewUrl}
            analysis={draft.analysis || analysis}
            onComplete={handleCompleteDraft}
            onUndo={onUndoBill ? handleUndo : null}
            completing={completing}
            undoing={undoing}
          />
        </div>
      )}

      {applied && !draft && (
        <div className="mt-6 space-y-4">
          <AppliedBillCard
            applied={applied}
            previewUrl={applied.previewUrl || previewUrl}
            onUndo={onUndoBill ? handleUndo : null}
            undoing={undoing}
          />
          <BillAnalysisResult
            analysis={applied.analysis || analysis}
            previewUrl={null}
            applied
            transactionType={applied.impact?.type}
          />
        </div>
      )}
    </section>
  );
}
