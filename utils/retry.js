function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(label, operation, options = {}) {
  const attempts = Math.max(1, Number(options.attempts || 1));
  const delayMs = Math.max(0, Number(options.delayMs || 0));
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) break;
      if (typeof options.onRetry === "function") {
        options.onRetry({ label, attempt, attempts, error });
      }
      if (delayMs) await sleep(delayMs * attempt);
    }
  }

  const wrapped = new Error(`${label} failed after ${attempts} attempt(s): ${lastError?.message || "Unknown error"}`);
  wrapped.cause = lastError;
  throw wrapped;
}

module.exports = {
  withRetry,
};
