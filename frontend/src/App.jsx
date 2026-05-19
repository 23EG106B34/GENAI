import { useCallback, useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Charts from './components/Charts';
import BillUpload from './components/BillUpload';
import BillScanHistory from './components/BillScanHistory';
import { applyBillScan, completeBillScan, fetchBillScans, undoBillScan } from './api/bills';
import {
  fetchTransactions,
  fetchSummary,
  createTransaction,
  deleteTransaction,
} from './api/transactions';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [billScans, setBillScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [undoingBillId, setUndoingBillId] = useState(null);
  const [error, setError] = useState(null);
  const [summaryPulse, setSummaryPulse] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [txRes, summaryRes, scansRes] = await Promise.all([
        fetchTransactions(),
        fetchSummary(),
        fetchBillScans(8),
      ]);
      setTransactions(txRes.data);
      setSummary(summaryRes.data);
      setBillScans(scansRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async (transaction) => {
    setSubmitting(true);
    setError(null);
    try {
      await createTransaction(transaction);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyBill = async (payload) => {
    setError(null);
    const res = await applyBillScan(payload);
    if (res.data?.summaryAfter) {
      setSummary(res.data.summaryAfter);
      setSummaryPulse(true);
      setTimeout(() => setSummaryPulse(false), 2000);
    }
    await loadData();
    return res.data;
  };

  const handleCompleteBill = async (billScanId, amount) => {
    setError(null);
    const res = await completeBillScan(billScanId, amount);
    setSummary(res.data.summaryAfter);
    setSummaryPulse(true);
    setTimeout(() => setSummaryPulse(false), 2000);
    await loadData();
    return res.data;
  };

  const handleUndoBill = async (billScanId) => {
    setUndoingBillId(billScanId);
    setError(null);
    try {
      await undoBillScan(billScanId);
      await loadData();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUndoingBillId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteTransaction(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      {error && (
        <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <Dashboard summary={summary} highlight={summaryPulse} />

          <BillUpload
            onApplyBill={handleApplyBill}
            onCompleteBill={handleCompleteBill}
            onUndoBill={handleUndoBill}
          />

          {billScans.length > 0 && (
            <BillScanHistory
              scans={billScans}
              onUndo={handleUndoBill}
              undoingId={undoingBillId}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TransactionForm onSubmit={handleAdd} loading={submitting} />
            <TransactionList
              transactions={transactions}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          </div>

          <Charts transactions={transactions} />
        </div>
      )}
    </Layout>
  );
}
