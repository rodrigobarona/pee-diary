import { renderHook } from "@testing-library/react-native";

import { useWindowClass } from "@/hooks/use-window-class";

let mockWindow = { width: 411, height: 914, scale: 2.625, fontScale: 1 };
let mockFrame = { x: 0, y: 0, width: 411, height: 914 };

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));
jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaFrame: () => mockFrame,
}));

function mockSizes(
  window: { width: number; height: number; fontScale?: number },
  frame: { width: number; height: number }
) {
  mockWindow = { scale: 2.625, fontScale: 1, ...window };
  mockFrame = { x: 0, y: 0, ...frame };
}

describe("useWindowClass", () => {
  it.each([
    [411, 914, "compact"], // phone, or a foldable folded
    [673, 841, "medium"], // unfolded foldable, portrait
    [841, 673, "expanded"], // unfolded foldable, landscape
  ])("%d x %d is %s", (width, height, widthClass) => {
    mockSizes({ width, height }, { width, height });
    const { result } = renderHook(() => useWindowClass());
    expect(result.current.widthClass).toBe(widthClass);
    expect(result.current.isCompact).toBe(widthClass === "compact");
    expect(result.current.width).toBe(width);
  });

  it("trusts the measured root frame when the window size lags behind (Android 15 after unfolding)", () => {
    mockSizes({ width: 411, height: 914 }, { width: 673, height: 841 });
    const { result } = renderHook(() => useWindowClass());
    expect(result.current.widthClass).toBe("medium");
    expect(result.current.width).toBe(673);
  });

  it("falls back to the window size before the frame is measured", () => {
    mockSizes({ width: 841, height: 673 }, { width: 0, height: 0 });
    const { result } = renderHook(() => useWindowClass());
    expect(result.current.widthClass).toBe("expanded");
  });

  it("passes the text size through for pane decisions", () => {
    mockSizes({ width: 841, height: 673, fontScale: 1.3 }, { width: 841, height: 673 });
    const { result } = renderHook(() => useWindowClass());
    expect(result.current.fontScale).toBe(1.3);
  });
});
