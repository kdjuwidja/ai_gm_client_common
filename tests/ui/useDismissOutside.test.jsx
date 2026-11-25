import { fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import useDismissOutside from "../../src/ui/useDismissOutside.js";

function Harness({ open, onDismiss }) {
  const rootRef = useRef(null);
  useDismissOutside({ open, rootRef, onDismiss });
  return (
    <div>
      <div ref={rootRef}><input aria-label="box" /></div>
      <button type="button">outside</button>
    </div>
  );
}

describe("useDismissOutside", () => {
  it("dismisses on a press outside, not inside", () => {
    const onDismiss = vi.fn();
    const { getByLabelText, getByText } = render(<Harness open onDismiss={onDismiss} />);
    fireEvent.pointerDown(getByLabelText("box"));
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.pointerDown(getByText("outside"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("dismisses on an Escape nothing else handled", () => {
    const onDismiss = vi.fn();
    const { getByLabelText } = render(<Harness open onDismiss={onDismiss} />);
    const box = getByLabelText("box");

    const handled = e => e.preventDefault();
    box.addEventListener("keydown", handled);
    fireEvent.keyDown(box, { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();

    box.removeEventListener("keydown", handled);
    fireEvent.keyDown(box, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("listens only while open, and calls the latest onDismiss", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { getByText, rerender } = render(<Harness open={false} onDismiss={first} />);
    fireEvent.pointerDown(getByText("outside"));
    expect(first).not.toHaveBeenCalled();

    rerender(<Harness open onDismiss={latest} />);
    fireEvent.pointerDown(getByText("outside"));
    expect(latest).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();

    rerender(<Harness open={false} onDismiss={latest} />);
    fireEvent.pointerDown(getByText("outside"));
    expect(latest).toHaveBeenCalledOnce();
  });
});
