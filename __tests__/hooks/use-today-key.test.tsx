import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";

import { useTodayKey } from "@/hooks/use-today-key";

describe("useTodayKey", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("moves to the new day at local midnight while the app stays open", () => {
    jest.setSystemTime(new Date(2026, 10, 10, 23, 59, 0));
    const { result } = renderHook(() => useTodayKey());
    expect(result.current).toBe("2026-11-10");

    act(() => {
      jest.advanceTimersByTime(62_000);
    });
    expect(result.current).toBe("2026-11-11");

    // And again the next night
    act(() => {
      jest.advanceTimersByTime(24 * 3600_000);
    });
    expect(result.current).toBe("2026-11-12");
  });

  it("moves to the new day when the app returns from the background", () => {
    const listeners: ((state: string) => void)[] = [];
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_, listener) => {
        listeners.push(listener as (state: string) => void);
        return { remove: jest.fn() } as never;
      });

    jest.setSystemTime(new Date(2026, 10, 10, 22, 0, 0));
    const { result } = renderHook(() => useTodayKey());
    expect(result.current).toBe("2026-11-10");

    // The phone slept through midnight: timers did not run
    jest.setSystemTime(new Date(2026, 10, 11, 7, 30, 0));
    act(() => {
      listeners.forEach((listener) => listener("active"));
    });
    expect(result.current).toBe("2026-11-11");
  });
});
