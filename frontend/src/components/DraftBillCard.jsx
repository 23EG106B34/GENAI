import { useState } from 'react';
import { formatCurrency } from '../utils/format';
import BillAnalysisResult from './BillAnalysisResult';

export default function DraftBillCard({
  draft,
  previewUrl,
  analysis,
  onComplete,
  onUndo,
  completing,
  undoing,
}) {
  const [amount, setAmount] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleComplete = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setLocalError('Enter a valid amount greater than zero');
      return;
    }
    setLocalError(null);
    await onComplete(draft.billScan._id, val);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">📝</span>
          <div className="flex-1">
            <p className="text-amber-400 text-sm font-semibold uppercase tracking-wide">
              Draft saved — amount needed
            </p>
            <p className="text-white font-medium mt-1">{draft.billScan.fileName}</p>
            <p className="text-slate-400 text-sm mt-1">
              {draft.billScan.billCategoryIcon} {draft.billScan.billCategoryLabel} · Vendor & type
              detected · enter the missing amount below
            </p>
          </div>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Bill"
              className="w-16 h-16 rounded-lg object-cover border border-slate-700"
            />
          )}
        </div>

        <form onSubmit={handleComplete} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="draft-amount" className="block text-xs text-slate-400 mb-1">
              Total amount (₹)
            </label>
            <input
              id="draft-amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 450.00"
              className="w-full rounded-lg border border-amber-500/40 bg-slate-800/80 px-4 py-2.5 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit"
            disabled={completing}
            className="sm:self-end rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 font-semibold text-slate-950 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
          >
            {completing ? 'Applying...' : 'Complete & Update Totals'}
          </button>
        </form>

        {localError && <p className="text-rose-400 text-sm mt-2">{localError}</p>}

        {onUndo && (
          <button
            type="button"
            onClick={() => onUndo(draft.billScan._id)}
            disabled={undoing}
            className="mt-3 text-xs text-slate-500 hover:text-rose-400"
          >
            {undoing ? 'Removing...' : 'Discard draft'}
          </button>
        )}
      </div>

      {analysis && (
        <BillAnalysisResult
          analysis={analysis}
          previewUrl={null}
          applied={false}
          transactionType={draft.billScan.transactionType}
        />
      )}
    </div>
  );
}
