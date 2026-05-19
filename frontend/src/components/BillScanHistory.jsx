import { formatCurrency, formatDate } from '../utils/format';

export default function BillScanHistory({ scans, onUndo, undoingId }) {
  if (!scans?.length) return null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
      <h2 className="text-lg font-semibold text-white mb-1">Recent bills</h2>
      <p className="text-sm text-slate-400 mb-4">Applied and draft uploads</p>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {scans.map((scan) => {
          const isIncome = scan.transactionType === 'income';
          return (
            <li
              key={scan._id}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/30 px-4 py-3"
            >
              <span className="text-2xl shrink-0">{scan.billCategoryIcon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{scan.fileName}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  {scan.billCategoryLabel} · {formatDate(scan.createdAt)}
                  {scan.status === 'draft' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400">
                      draft
                    </span>
                  )}
                </p>
              </div>
              <span
                className={`text-sm font-semibold shrink-0 ${
                  scan.status === 'draft'
                    ? 'text-amber-400'
                    : isIncome
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                }`}
              >
                {scan.status === 'draft'
                  ? 'Amount?'
                  : `${isIncome ? '+' : '−'}${formatCurrency(scan.amount)}`}
              </span>
              <button
                type="button"
                onClick={() => onUndo(scan._id)}
                disabled={undoingId === scan._id}
                className="text-xs text-slate-500 hover:text-rose-400 shrink-0 disabled:opacity-50"
                title="Undo"
              >
                Undo
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
