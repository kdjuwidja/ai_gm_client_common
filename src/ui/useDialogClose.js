// Closing a modal <dialog> for dialogs that may sit inside one another (an
// editor, its picker, a confirm). Escape is handled on the dialog it was
// pressed in and closes that one only. The browser's own close (or cancel)
// still reaches `onClose`, so React's state follows, but only the dialog's
// own: React passes a nested dialog's close event up to its parents'
// handlers, which mustn't close them too. Spread the result onto the <dialog>.
export default function useDialogClose(onClose) {
  const own = e => e.target === e.currentTarget;
  return {
    onKeyDown(e) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    },
    onCancel(e) {
      if (!own(e)) return;
      e.preventDefault();
      onClose();
    },
    onClose(e) {
      if (own(e)) onClose();
    },
  };
}
