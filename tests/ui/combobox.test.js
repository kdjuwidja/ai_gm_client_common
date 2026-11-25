import { describe, expect, it } from "vitest";
import { comboboxProps, optionId } from "../../src/ui/combobox.js";

describe("optionId", () => {
  it("names an option by its list and place", () => {
    expect(optionId("cmds", 0)).toBe("cmds-option-0");
    expect(optionId("cmds", 3)).toBe("cmds-option-3");
  });
});

describe("comboboxProps", () => {
  it("points the box at the list and its highlighted option while open", () => {
    expect(comboboxProps({ listId: "cmds", open: true, activeIndex: 1 })).toEqual({
      "aria-autocomplete": "list",
      "aria-controls": "cmds",
      "aria-activedescendant": "cmds-option-1",
    });
  });

  it("names no option while nothing is highlighted", () => {
    expect(comboboxProps({ listId: "cmds", open: true, activeIndex: -1 })["aria-activedescendant"]).toBeUndefined();
  });

  it("points nowhere while closed, and never changes the box's own role", () => {
    const props = comboboxProps({ listId: "cmds", open: false, activeIndex: 0 });
    expect(props.role).toBeUndefined();
    expect(props["aria-controls"]).toBeUndefined();
    expect(props["aria-activedescendant"]).toBeUndefined();
  });
});
