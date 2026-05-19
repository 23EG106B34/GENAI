import { formatCurrency } from '../utils/format';

function StatCard({ label, value, icon, accent, highlight }) {
  const accents = {
    balance: 'from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-300',
    income: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-300',
    expense: 'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-300',
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-6 shadow-xl transition-all duration-500 ${accents[accent]} ${
        highlight ? 'ring-2 ring-cyan-400/60 scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatCurrency(value)}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/50">{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard({ summary, highlight }) {
  const { balance = 0, income = 0, expenses = 0 } = summary || {};

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <StatCard
        label="Total Balance"
        value={balance}
        accent="balance"
        highlight={highlight}
        icon={
          <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        }
      />
      <StatCard
        label="Total Income / Salary"
        value={income}
        accent="income"
        highlight={highlight}
        icon={
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        }
      />
      <StatCard
        label="Total Expenses"
        value={expenses}
        accent="expense"
        highlight={highlight}
        icon={
          <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        }
      />
    </section>
  );
}
