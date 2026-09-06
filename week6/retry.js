// Retries on timeout, 429, and 5xx only. Never retries 400/401/403 — a bad
// key or bad request will still be bad in four seconds, and on a metered
// free tier a pointless retry burns real quota.

function isRetryable(err) {
  const status = err?.status ?? err?.response?.status;
  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;
  if (err?.name === "APIConnectionTimeoutError" || err?.code === "ETIMEDOUT") return true;
  return false;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, maxAttempts = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === maxAttempts) throw err;

      const retryAfterHeader = err?.headers?.["retry-after"];
      const waitMs = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : 2 ** attempt * 1000 + Math.random() * 250; // backoff + jitter

      await sleep(waitMs);
    }
  }
  throw lastErr;
}

module.exports = { withRetry, isRetryable };
