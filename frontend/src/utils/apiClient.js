export async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    if (!response.ok) {
      throw new Error(`Server returned ${response.status} with an empty body.`);
    }
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    const preview = text.slice(0, 80).replace(/\s+/g, ' ');
    if (text.trimStart().startsWith('<')) {
      throw new Error(
        'API returned HTML instead of JSON. Check that the backend is deployed and VITE_API_BASE_URL is set to /_/backend/api on Vercel.'
      );
    }
    throw new Error(`Invalid JSON from server (${response.status}): ${preview}`);
  }
}

export async function handleResponse(response) {
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}
