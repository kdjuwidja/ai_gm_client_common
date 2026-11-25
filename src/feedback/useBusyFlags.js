import { useCallback, useState } from "react";

// What the user is waiting on: one flag per request in flight, by a key the
// client picks (e.g. "saveProfile", or an item's id), behind a button's
// spinner or a lock. busy[key] is the flag's value (unset is falsy).
export default function useBusyFlags() {
  const [busy, setBusy] = useState({});

  const setBusyFlag = useCallback((key, value) => {
    setBusy(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearBusy = useCallback(() => setBusy({}), []);

  return { busy, setBusyFlag, clearBusy };
}
