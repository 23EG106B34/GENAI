import { API_BASE } from '../config/apiBase.js';
import { handleResponse } from '../utils/apiClient.js';

const TRANSACTIONS_BASE = `${API_BASE}/transactions`;

export async function fetchTransactions() {
  const res = await fetch(TRANSACTIONS_BASE);
  return handleResponse(res);
}

export async function fetchSummary() {
  const res = await fetch(`${TRANSACTIONS_BASE}/summary`);
  return handleResponse(res);
}

export async function createTransaction(transaction) {
  const res = await fetch(TRANSACTIONS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  return handleResponse(res);
}

export async function deleteTransaction(id) {
  const res = await fetch(`${TRANSACTIONS_BASE}/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}
