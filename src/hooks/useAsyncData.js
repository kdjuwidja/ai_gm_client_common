import { useCallback, useEffect, useState } from "react";

// Loads data from a promise-returning `loader` on mount, with a retry.
// Returns { data, error, loading, retry }: enough to show a placeholder, an
// inline error with a Retry button, or the content. `error` is the failure's
// message. A new `loader` loads again, so pass a stable one (a module-level
// function such as `fetchUsers`, or one kept with useCallback).
export default function useAsyncData(loader) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState(prev => ({ ...prev, error: null, loading: true }));
    loader()
      .then(data => { if (!cancelled) setState({ data, error: null, loading: false }); })
      .catch(err => { if (!cancelled) setState({ data: null, error: err?.message || String(err), loading: false }); });
    return () => { cancelled = true; };
  }, [loader, attempt]);

  const retry = useCallback(() => setAttempt(n => n + 1), []);
  return { ...state, retry };
}
