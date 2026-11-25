import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Room kept between a popout and the window's edges, in px.
const EDGE = 8;

// Something that pops out beside an element (a stat card, a chat bubble),
// drawn over the page rather than inside its panel, so a scrolling or clipped
// panel can't cut it off. It sits `gap` px to the right of `anchorRef`'s
// element, `offsetY` px below its top, kept inside the window, and follows the
// element as the page scrolls or resizes. It has no look of its own: the
// caller's className and style give it one.
export default function Popout({ anchorRef, open, gap = 14, offsetY = 0, className, style, children, ...rest }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return undefined; }
    function place() {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const el = ref.current;
      if (!anchor || !el) return;
      const maxTop = window.innerHeight - el.offsetHeight - EDGE;
      const top = Math.max(EDGE, Math.min(anchor.top + offsetY, maxTop));
      const left = Math.min(anchor.right + gap, window.innerWidth - el.offsetWidth - EDGE);
      setPos(prev => (prev?.top === top && prev?.left === left ? prev : { top, left }));
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, gap, offsetY]);

  if (!open) return null;
  return createPortal(
    <div
      ref={ref} className={className}
      style={{ ...style, position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? "visible" : "hidden" }}
      {...rest}
    >
      {children}
    </div>,
    document.body,
  );
}
