/** fetch with a timeout and JSON parsing; throws on non-2xx. */
export async function getJson(url, { timeout = 10000, headers = {}, method = 'GET', body } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { method, headers, body, signal: ctrl.signal });
    if (!res.ok) {
      const err = new Error(`${res.status} ${res.statusText} for ${url.split('?')[0]}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}
