import { API_BASE } from '../config/apiBase.js';
import { handleResponse } from '../utils/apiClient.js';

export async function scanReceipt(file) {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await fetch(`${API_BASE}/receipts/scan`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse(response);
}
