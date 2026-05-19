export async function scanReceipt(file) {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await fetch('/api/receipts/scan', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to scan receipt');
  }

  return data;
}
