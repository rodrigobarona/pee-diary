import { fitsTwoPanes, widthClassFor } from "@/lib/layout/window-class";

describe("widthClassFor", () => {
  it.each([
    [360, "compact"], // phone
    [411, "compact"], // Pixel, Galaxy S
    [599, "compact"],
    [600, "medium"],
    [673, "medium"], // Galaxy Z Fold inner screen, portrait
    [839, "medium"],
    [840, "expanded"],
    [904, "expanded"], // foldable inner screen, landscape
    [1280, "expanded"],
  ])("%d is %s", (width, expected) => {
    expect(widthClassFor(width)).toBe(expected);
  });
});

describe("fitsTwoPanes", () => {
  it("splits a landscape foldable at the default text size", () => {
    expect(fitsTwoPanes(904, 1)).toBe(true);
  });
  it("keeps one pane on a phone", () => {
    expect(fitsTwoPanes(411, 1)).toBe(false);
  });
  it("keeps one pane when large text would squeeze the panes", () => {
    expect(fitsTwoPanes(904, 1.5)).toBe(false);
  });
  it("never shrinks the pane below its minimum for small text", () => {
    expect(fitsTwoPanes(663, 0.85)).toBe(false);
    expect(fitsTwoPanes(664, 0.85)).toBe(true);
  });
});
