import { useEffect, useRef, useState } from "react";

// How long a notice that isn't an error stays up before it leaves on its own.
export const INFO_NOTICE_MS = 6000;

// What the user should be told that isn't the app's own state: errors, short
// notes and anything else a client shows as a notice. Only the list: how a
// notice looks, and which tones a client has, are the client's.
//
// notices: [{ id, tone, text, ...extra }]. notify(text, tone = "error", extra)
// adds one and returns its id; `extra` is kept on it as given (a client's own
// fields, e.g. the item a "new item" notice shows). An "error" stays until
// dismiss(id); any other tone leaves after `infoMs`.
export default function useNotices({ infoMs = INFO_NOTICE_MS } = {}) {
  const [notices, setNotices] = useState([]);
  const nextIdRef = useRef(0);
  const timersRef = useRef(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  function dismiss(id) {
    clearTimeout(timersRef.current.get(id));
    timersRef.current.delete(id);
    setNotices(prev => prev.filter(n => n.id !== id));
  }

  function notify(text, tone = "error", extra = {}) {
    const id = ++nextIdRef.current;
    setNotices(prev => [...prev, { ...extra, id, tone, text }]);
    if (tone !== "error") timersRef.current.set(id, setTimeout(() => dismiss(id), infoMs));
    return id;
  }

  return { notices, notify, dismiss };
}
