import { useState, useCallback } from 'react';

// Wraps any async function and exposes { run, data, loading, error }.
// Keeps AI-generation pages (diet plan / workout plan / feedback) free
// of repeated try/catch/loading boilerplate.
export function useAsyncAction(asyncFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || 'Something went wrong');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { run, data, loading, error, setData };
}
