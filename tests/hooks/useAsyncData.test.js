import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useAsyncData from "../../src/hooks/useAsyncData.js";

describe("useAsyncData", () => {
  it("loads on mount", async () => {
    const loader = vi.fn(async () => ["a", "b"]);
    const { result } = renderHook(() => useAsyncData(loader));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["a", "b"]);
    expect(result.current.error).toBeNull();
    expect(loader).toHaveBeenCalledOnce();
  });

  it("gives a failure's message, and loads again on retry", async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error("Request failed (502)"))
      .mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useAsyncData(loader));
    await waitFor(() => expect(result.current.error).toBe("Request failed (502)"));
    expect(result.current.data).toBeNull();

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.data).toEqual({ ok: true }));
    expect(result.current.error).toBeNull();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("ignores an answer that comes after unmounting", async () => {
    let resolve;
    const loader = () => new Promise(r => { resolve = r; });
    const { result, unmount } = renderHook(() => useAsyncData(loader));
    const before = result.current;
    unmount();
    await act(async () => { resolve("late"); });
    expect(result.current).toBe(before);
  });
});
