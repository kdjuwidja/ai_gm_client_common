import { useEffect } from "react";

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

// Keyboard and dismissal behaviour for a dropdown menu:
//   - opening moves focus into the menu (the checked item, else the first);
//   - ↑/↓ (and Home/End) move between items;
//   - Escape closes and returns focus to the toggle button;
//   - Tab, or a press anywhere outside `rootRef`, closes without moving focus.
// Returns `closeToToggle()` for an item's own handler to call after acting.
export default function useMenuKeyboard({ open, setOpen, rootRef, toggleRef, menuRef }) {
  function closeToToggle() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return undefined;
    const menu = menuRef.current;
    const items = () => [...(menu?.querySelectorAll(ITEM_SELECTOR) ?? [])];
    // An empty menu takes focus itself, so Escape still brings focus back.
    (menu?.querySelector('[aria-checked="true"]') ?? items()[0] ?? menu)?.focus();

    function onKey(e) {
      const list = items();
      const at = list.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); closeToToggle(); }
      else if (e.key === "Tab") setOpen(false);
      else if (!list.length) return;
      else if (e.key === "ArrowDown") { e.preventDefault(); list[(at + 1) % list.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); list[(at - 1 + list.length) % list.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); list[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); list[list.length - 1].focus(); }
    }
    function onPointer(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return { closeToToggle };
}
