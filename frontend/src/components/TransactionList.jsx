import { formatCurrency, formatDate } from '../utils/format';

export default function TransactionList({ transactions, onDelete, deletingId }) {
  if (!transactions.length) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Recent History</h2>
        <p className="text-slate-400 text-center py-8">No transactions yet. Add your first one above!</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
      <h2 className="text-lg font-semibold text-white mb-4">Recent History</h2>
      <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {transactions.map((tx) => (
          <li
            key={tx._id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-3 hover:bg-slate-800/70 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  tx.type === 'income'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                {tx.type === 'income' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{tx.title}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                  {tx.category} &middot; {formatDate(tx.date)}
                  {tx.source === 'bill_scan' && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500/15 text-cyan-400">
                      from bill
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`font-semibold ${
                  tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </span>
              <button
                type="button"
                onClick={() => onDelete(tx._id)}
                disabled={deletingId === tx._id}
                aria-label={`Delete ${tx.title}`}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
