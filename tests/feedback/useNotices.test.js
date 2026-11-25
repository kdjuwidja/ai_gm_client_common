import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useNotices, { INFO_NOTICE_MS } from "../../src/feedback/useNotices.js";

describe("useNotices", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("adds an error by default, and keeps it until it's dismissed", () => {
    const { result } = renderHook(() => useNotices());
    let id;
    act(() => { id = result.current.notify("Couldn't save."); });
    expect(result.current.notices).toEqual([{ id, tone: "error", text: "Couldn't save." }]);

    act(() => { vi.advanceTimersByTime(INFO_NOTICE_MS * 10); });
    expect(result.current.notices).toHaveLength(1);

    act(() => result.current.dismiss(id));
    expect(result.current.notices).toEqual([]);
  });

  it("lets any other tone leave on its own after the info time", () => {
    const { result } = renderHook(() => useNotices());
    act(() => { result.current.notify("Saved.", "info"); });
    act(() => { vi.advanceTimersByTime(INFO_NOTICE_MS - 1); });
    expect(result.current.notices).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.notices).toEqual([]);
  });

  it("takes its own info time", () => {
    const { result } = renderHook(() => useNotices({ infoMs: 100 }));
    act(() => { result.current.notify("Saved.", "info"); });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current.notices).toEqual([]);
  });

  it("keeps a client's own fields, and its own tones, without letting them replace id, tone or text", () => {
    const { result } = renderHook(() => useNotices());
    let id;
    act(() => { id = result.current.notify("Rope", "item", { item: { id: "rope" }, id: 999, text: "x" }); });
    expect(result.current.notices).toEqual([{ id, tone: "item", text: "Rope", item: { id: "rope" } }]);
  });

  it("gives every notice its own id, in order", () => {
    const { result } = renderHook(() => useNotices());
    act(() => {
      result.current.notify("a");
      result.current.notify("b", "info");
    });
    const [a, b] = result.current.notices;
    expect(b.id).toBeGreaterThan(a.id);
  });

  it("dismissing early stops a notice's own timer", () => {
    const { result } = renderHook(() => useNotices());
    let first;
    act(() => { first = result.current.notify("first", "info"); });
    act(() => result.current.dismiss(first));
    act(() => { result.current.notify("second", "info"); });
    act(() => { vi.advanceTimersByTime(INFO_NOTICE_MS - 1); });
    expect(result.current.notices.map(n => n.text)).toEqual(["second"]);
  });

  it("stops its timers when unmounted", () => {
    const { result, unmount } = renderHook(() => useNotices());
    act(() => { result.current.notify("Saved.", "info"); });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
