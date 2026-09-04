/**
 * mongodb-memory-server picks a random port and gives up after a small,
 * fixed number of tries ("Max port tries exceeded") — transient in a
 * constrained/sandboxed environment, especially when several test files
 * start their own instance around the same time. Retrying the start call
 * itself (not the whole suite) is the narrowest fix; the underlying setup
 * is otherwise correct.
 */
export async function retryOnPortContention<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  throw lastError;
}
