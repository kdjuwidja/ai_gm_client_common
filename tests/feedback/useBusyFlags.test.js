import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useBusyFlags from "../../src/feedback/useBusyFlags.js";

describe("useBusyFlags", () => {
  it("sets and clears flags by key", () => {
    const { result } = renderHook(() => useBusyFlags());
    expect(result.current.busy).toEqual({});

    act(() => result.current.setBusyFlag("saveProfile", true));
    act(() => result.current.setBusyFlag("item", "rope"));
    expect(result.current.busy).toEqual({ saveProfile: true, item: "rope" });

    act(() => result.current.setBusyFlag("saveProfile", false));
    expect(result.current.busy.saveProfile).toBe(false);

    act(() => result.current.clearBusy());
    expect(result.current.busy).toEqual({});
  });

  it("keeps its setters the same across renders", () => {
    const { result, rerender } = renderHook(() => useBusyFlags());
    const { setBusyFlag, clearBusy } = result.current;
    act(() => setBusyFlag("x", true));
    rerender();
    expect(result.current.setBusyFlag).toBe(setBusyFlag);
    expect(result.current.clearBusy).toBe(clearBusy);
  });
});
