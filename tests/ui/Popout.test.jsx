import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import Popout from "../../src/ui/Popout.jsx";

function Harness({ open, anchorRect, gap, offsetY }) {
  const anchorRef = useRef(null);
  return (
    <div>
      <span ref={el => {
        anchorRef.current = el;
        if (el) el.getBoundingClientRect = () => anchorRect;
      }}
      >anchor</span>
      <Popout anchorRef={anchorRef} open={open} gap={gap} offsetY={offsetY} className="card" data-testid="pop">
        card
      </Popout>
    </div>
  );
}

const popout = () => document.body.querySelector('[data-testid="pop"]');

describe("Popout", () => {
  it("renders nothing while closed", () => {
    render(<Harness open={false} anchorRect={{ top: 0, right: 0 }} />);
    expect(popout()).toBeNull();
  });

  it("sits beside its anchor, over the page, with the caller's look", () => {
    const { container } = render(<Harness open anchorRect={{ top: 100, right: 200 }} gap={10} offsetY={5} />);
    const el = popout();
    expect(container.contains(el)).toBe(false);
    expect(el.parentElement).toBe(document.body);
    expect(el.className).toBe("card");
    expect(el.style.position).toBe("fixed");
    expect(el.style.top).toBe("105px");
    expect(el.style.left).toBe("210px");
    expect(el.style.visibility).toBe("visible");
  });

  it("stays inside the window", () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(200);
    render(<Harness open anchorRect={{ top: window.innerHeight, right: window.innerWidth }} />);
    const el = popout();
    expect(el.style.top).toBe(`${window.innerHeight - 200 - 8}px`);
    expect(el.style.left).toBe(`${window.innerWidth - 300 - 8}px`);
  });

  it("follows its anchor when the page scrolls", () => {
    let rect = { top: 100, right: 200 };
    function Moving() {
      const anchorRef = useRef(null);
      return (
        <>
          <span ref={el => { anchorRef.current = el; if (el) el.getBoundingClientRect = () => rect; }}>anchor</span>
          <Popout anchorRef={anchorRef} open gap={0} data-testid="pop">card</Popout>
        </>
      );
    }
    render(<Moving />);
    expect(popout().style.top).toBe("100px");
    rect = { top: 40, right: 200 };
    act(() => { window.dispatchEvent(new Event("scroll")); });
    expect(popout().style.top).toBe("40px");
  });
});
