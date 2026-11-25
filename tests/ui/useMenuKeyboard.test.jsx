import { fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import useMenuKeyboard from "../../src/ui/useMenuKeyboard.js";

function Menu({ items = ["One", "Two", "Three"], checked = null, startOpen = true }) {
  const [open, setOpen] = useState(startOpen);
  const rootRef = useRef(null);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);
  const { closeToToggle } = useMenuKeyboard({ open, setOpen, rootRef, toggleRef, menuRef });
  return (
    <div>
      <div ref={rootRef}>
        <button type="button" ref={toggleRef} onClick={() => setOpen(o => !o)}>Toggle</button>
        {open && (
          <div role="menu" ref={menuRef} tabIndex={-1} aria-label="menu">
            {items.map(item => (
              <button
                key={item} type="button" role="menuitemradio" aria-checked={item === checked}
                onClick={closeToToggle}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button">Elsewhere</button>
    </div>
  );
}

const key = k => fireEvent.keyDown(document.activeElement, { key: k });

describe("useMenuKeyboard", () => {
  it("focuses the checked item on opening, else the first", () => {
    const { unmount } = render(<Menu checked="Two" />);
    expect(document.activeElement).toBe(screen.getByText("Two"));
    unmount();
    render(<Menu />);
    expect(document.activeElement).toBe(screen.getByText("One"));
  });

  it("focuses an empty menu itself", () => {
    render(<Menu items={[]} />);
    expect(document.activeElement).toBe(screen.getByRole("menu"));
  });

  it("moves between items with the arrows, Home and End, wrapping round", () => {
    render(<Menu />);
    key("ArrowDown");
    expect(document.activeElement.textContent).toBe("Two");
    key("ArrowUp");
    key("ArrowUp");
    expect(document.activeElement.textContent).toBe("Three");
    key("Home");
    expect(document.activeElement.textContent).toBe("One");
    key("End");
    expect(document.activeElement.textContent).toBe("Three");
  });

  it("closes on Escape, back to the toggle", () => {
    render(<Menu />);
    key("Escape");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByText("Toggle"));
  });

  it("closes on Tab and on a press outside, without moving focus", () => {
    render(<Menu />);
    key("Tab");
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.pointerDown(screen.getByText("Toggle"));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.pointerDown(screen.getByText("Elsewhere"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("gives items closeToToggle", () => {
    render(<Menu />);
    fireEvent.click(screen.getByText("Two"));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByText("Toggle"));
  });
});
