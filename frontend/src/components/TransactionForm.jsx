import { useState } from 'react';
import ReceiptScanDropzone from './ReceiptScanDropzone';

const CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Other',
];

const initialForm = {
  title: '',
  amount: '',
  category: 'Food',
  type: 'expense',
  date: new Date().toISOString().split('T')[0],
};

export default function TransactionForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialForm);
  const [scanMeta, setScanMeta] = useState(null);
  const [scanError, setScanError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (scanMeta) setScanMeta(null);
  };

  const handleScanComplete = (data) => {
    setScanError(null);
    setForm({
      title: data.title || data.vendorName || '',
      amount: data.amount || data.totalAmount ? String(data.amount || data.totalAmount) : '',
      category: CATEGORIES.includes(data.category) ? data.category : 'Other',
      type: data.type === 'income' ? 'income' : 'expense',
      date: data.date || new Date().toISOString().split('T')[0],
    });
    setScanMeta({
      confidence: data.confidence,
      parserUsed: data.parserUsed,
      vendorName: data.vendorName,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({
      title: form.title.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      type: form.type,
      date: form.date,
    });
    setForm(initialForm);
    setScanMeta(null);
    setScanError(null);
  };

  const confidenceColors = {
    high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
      <h2 className="text-lg font-semibold text-white mb-1">Add Transaction</h2>
      <p className="text-sm text-slate-400 mb-4">Scan a receipt or enter details manually</p>

      <ReceiptScanDropzone
        onScanComplete={handleScanComplete}
        onScanError={setScanError}
      />

      {scanError && (
        <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {scanError}
        </div>
      )}

      {scanMeta && (
        <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2.5 flex items-center justify-between gap-2">
          <p className="text-sm text-cyan-200">
            Form filled from receipt
            {scanMeta.vendorName ? ` · ${scanMeta.vendorName}` : ''}
          </p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${
              confidenceColors[scanMeta.confidence] || confidenceColors.low
            }`}
          >
            {scanMeta.confidence} confidence
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-400 mb-1.5">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. KFC, Grocery shopping"
            className={`w-full rounded-lg border bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
              scanMeta ? 'border-cyan-500/50' : 'border-slate-700'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-400 mb-1.5">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className={`w-full rounded-lg border bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                scanMeta ? 'border-cyan-500/50' : 'border-slate-700'
              }`}
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-400 mb-1.5">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-400 mb-1.5">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-slate-800/80 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                scanMeta ? 'border-cyan-500/50' : 'border-slate-700'
              }`}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1.5">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              value={form.date}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-slate-800/80 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                scanMeta ? 'border-cyan-500/50' : 'border-slate-700'
              }`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : scanMeta ? 'Review & Save Transaction' : 'Add Transaction'}
        </button>
      </form>
    </section>
  );
}
