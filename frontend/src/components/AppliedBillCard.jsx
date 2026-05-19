import { formatCurrency } from '../utils/format';

function ImpactRow({ label, before, after, highlight }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-slate-400">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-slate-500 line-through text-xs">{formatCurrency(before)}</span>
        <span className="text-slate-600">→</span>
        <span className={`font-semibold ${highlight ? 'text-white' : 'text-slate-200'}`}>
          {formatCurrency(after)}
        </span>
      </span>
    </div>
  );
}

export default function AppliedBillCard({ applied, previewUrl, onUndo, undoing }) {
  if (!applied) return null;

  const { billScan, impact, summaryBefore, summaryAfter } = applied;
  const isIncome = impact.type === 'income';

  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide">
            Applied & Saved Automatically
          </p>
          <p className="text-white font-medium truncate mt-0.5">
            {billScan.fileName}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            {billScan.billCategoryIcon} {billScan.billCategoryLabel} ·{' '}
            {isIncome ? 'Added to income' : 'Recorded as expense'} ·{' '}
            {formatCurrency(impact.amount)}
          </p>
        </div>
        {previewUrl && (
          <img
            src={previewUrl}
            alt=""
            className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
          />
        )}
      </div>

      <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          Updated totals
        </p>
        <div className="space-y-2">
          <ImpactRow
            label="Balance"
            before={summaryBefore.balance}
            after={summaryAfter.balance}
            highlight
          />
          <ImpactRow
            label="Total income"
            before={summaryBefore.income}
            after={summaryAfter.income}
            highlight={isIncome}
          />
          <ImpactRow
            label="Total expenses"
            before={summaryBefore.expenses}
            after={summaryAfter.expenses}
            highlight={!isIncome}
          />
        </div>
        <p
          className={`mt-3 text-sm font-medium ${
            isIncome ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isIncome ? '+' : '−'}
          {formatCurrency(impact.amount)}{' '}
          {isIncome ? 'added to salary/income' : 'added to expenses'}
        </p>
      </div>

      {onUndo && (
        <button
          type="button"
          onClick={() => onUndo(billScan._id)}
          disabled={undoing}
          className="text-xs text-slate-400 hover:text-rose-400 transition disabled:opacity-50"
        >
          {undoing ? 'Undoing...' : 'Undo this application (removes transaction)'}
        </button>
      )}
    </div>
  );
}
