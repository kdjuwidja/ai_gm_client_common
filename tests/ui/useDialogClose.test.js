import { describe, expect, it, vi } from "vitest";
import useDialogClose from "../../src/ui/useDialogClose.js";

function event({ key, own = true } = {}) {
  const dialog = {};
  return {
    key,
    target: dialog,
    currentTarget: own ? dialog : {},
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
}

describe("useDialogClose", () => {
  it("closes on Escape, keeping it from the dialogs around it", () => {
    const onClose = vi.fn();
    const e = event({ key: "Escape" });
    useDialogClose(onClose).onKeyDown(e);
    expect(onClose).toHaveBeenCalledOnce();
    expect(e.preventDefault).toHaveBeenCalled();
    expect(e.stopPropagation).toHaveBeenCalled();
  });

  it("ignores other keys", () => {
    const onClose = vi.fn();
    const e = event({ key: "Enter" });
    useDialogClose(onClose).onKeyDown(e);
    expect(onClose).not.toHaveBeenCalled();
    expect(e.stopPropagation).not.toHaveBeenCalled();
  });

  it("follows the dialog's own cancel and close, not a nested one's", () => {
    const onClose = vi.fn();
    const handlers = useDialogClose(onClose);

    const ownCancel = event();
    handlers.onCancel(ownCancel);
    handlers.onClose(event());
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(ownCancel.preventDefault).toHaveBeenCalled();

    const nestedCancel = event({ own: false });
    handlers.onCancel(nestedCancel);
    handlers.onClose(event({ own: false }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(nestedCancel.preventDefault).not.toHaveBeenCalled();
  });
});
