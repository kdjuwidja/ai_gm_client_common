// The accessible combobox pattern's wiring (WAI-ARIA 1.2, a listbox popup)
// for a text box and the list that belongs to it. The focus never leaves the
// box; ↑/↓ move a highlight that the box announces through
// aria-activedescendant, which names the highlighted option by its id. The
// list's markup and look are the client's own: give the list `id={listId}`,
// role="listbox", and each option role="option", aria-selected and
// `id={optionId(listId, i)}`.

// The id of the list's `index`-th option.
export function optionId(listId, index) {
  return `${listId}-option-${index}`;
}

// What the text box carries to drive the list. The box keeps its own role (a
// <textarea> may not take role="combobox"); a textbox supports all three of
// these, which is what a screen reader needs to follow the highlight.
export function comboboxProps({ listId, open, activeIndex }) {
  return {
    "aria-autocomplete": "list",
    "aria-controls": open ? listId : undefined,
    "aria-activedescendant": open && activeIndex >= 0 ? optionId(listId, activeIndex) : undefined,
  };
}
