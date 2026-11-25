import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useMediaQuery from "../../src/hooks/useMediaQuery.js";

// A media query list whose `matches` the test flips.
function fakeQueryList(matches) {
  const listeners = new Set();
  return {
    matches,
    addEventListener: (_type, fn) => listeners.add(fn),
    removeEventListener: (_type, fn) => listeners.delete(fn),
    flip(to) { this.matches = to; listeners.forEach(fn => fn()); },
    listeners,
  };
}

describe("useMediaQuery", () => {
  it("says whether the query matches, and follows it live", () => {
    const list = fakeQueryList(true);
    const matchMedia = vi.spyOn(window, "matchMedia").mockReturnValue(list);
    const { result, unmount } = renderHook(() => useMediaQuery("(max-width: 719px)"));

    expect(matchMedia).toHaveBeenCalledWith("(max-width: 719px)");
    expect(result.current).toBe(true);
    act(() => list.flip(false));
    expect(result.current).toBe(false);

    unmount();
    expect(list.listeners.size).toBe(0);
  });
});
