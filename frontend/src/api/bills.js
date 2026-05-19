const API_BASE = '/api/bills';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

export async function scanBill(file) {
  const formData = new FormData();
  formData.append('bill', file);

  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function applyBillScan(payload) {
  const res = await fetch(`${API_BASE}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function completeBillScan(id, amount) {
  const res = await fetch(`${API_BASE}/${id}/complete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  return handleResponse(res);
}

export async function fetchBillScans(limit = 8) {
  const res = await fetch(`${API_BASE}?limit=${limit}`);
  return handleResponse(res);
}

export async function undoBillScan(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}
