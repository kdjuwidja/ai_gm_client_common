import { useEffect, useState } from "react";

// True while `query` (a CSS media query, e.g. "(max-width: 719px)") matches;
// follows changes live. A client keeps its own breakpoints.
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
