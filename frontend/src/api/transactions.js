const API_BASE = '/api/transactions';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

export async function fetchTransactions() {
  const res = await fetch(API_BASE);
  return handleResponse(res);
}

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`);
  return handleResponse(res);
}

export async function createTransaction(transaction) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  return handleResponse(res);
}

export async function deleteTransaction(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}
