import { useEffect, useRef } from "react";

// Closing a pop-up that keeps the focus where it was (a text box's list) from
// outside it: while `open`, a press anywhere outside `rootRef`, or an Escape
// nothing else has handled (a key the box itself used is `defaultPrevented`),
// calls `onDismiss`. Unlike useMenuKeyboard it never moves the focus: a
// combobox's focus stays in its box.
export default function useDismissOutside({ open, rootRef, onDismiss }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(e) {
      if (!rootRef.current?.contains(e.target)) dismissRef.current();
    }
    function onKey(e) {
      if (e.key === "Escape" && !e.defaultPrevented && !e.isComposing) dismissRef.current();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, rootRef]);
}
