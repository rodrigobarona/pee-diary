import { TERMS_VERSION } from "@/constants/legal";
import {
  getLaunchAction,
  needsTermsAcceptance,
  type LaunchState,
} from "@/lib/utils/launch";

const state = (overrides: Partial<LaunchState> = {}): LaunchState => ({
  hasCompletedOnboarding: true,
  termsAcceptedVersion: TERMS_VERSION,
  openAddMenuOnLaunch: true,
  ...overrides,
});

describe("needsTermsAcceptance", () => {
  it("is false when the current version was accepted", () => {
    expect(needsTermsAcceptance(TERMS_VERSION, TERMS_VERSION)).toBe(false);
  });

  it("is true when an earlier version was accepted", () => {
    expect(needsTermsAcceptance("2026-01-01", "2026-11-11")).toBe(true);
  });

  it("is true when no acceptance was recorded", () => {
    expect(needsTermsAcceptance(null, TERMS_VERSION)).toBe(true);
  });
});

describe("getLaunchAction", () => {
  it("shows onboarding first, whatever the terms or add-menu settings", () => {
    expect(
      getLaunchAction(
        state({ hasCompletedOnboarding: false, termsAcceptedVersion: null }),
        TERMS_VERSION
      )
    ).toBe("onboarding");
    // Replaying the tutorial after accepting the current terms
    expect(
      getLaunchAction(state({ hasCompletedOnboarding: false }), TERMS_VERSION)
    ).toBe("onboarding");
  });

  it("shows the terms notice when the accepted version is out of date", () => {
    expect(
      getLaunchAction(state({ termsAcceptedVersion: "2026-01-01" }), "2026-11-11")
    ).toBe("termsUpdate");
  });

  it("shows the terms notice to installs that finished onboarding before acceptance was recorded", () => {
    expect(
      getLaunchAction(state({ termsAcceptedVersion: null }), TERMS_VERSION)
    ).toBe("termsUpdate");
  });

  it("shows the terms notice instead of the add menu, never both", () => {
    expect(
      getLaunchAction(
        state({ termsAcceptedVersion: null, openAddMenuOnLaunch: true }),
        TERMS_VERSION
      )
    ).toBe("termsUpdate");
  });

  it("opens the add menu when the terms are current and the setting is on", () => {
    expect(getLaunchAction(state(), TERMS_VERSION)).toBe("addMenu");
  });

  it("does nothing when the terms are current and the setting is off", () => {
    expect(
      getLaunchAction(state({ openAddMenuOnLaunch: false }), TERMS_VERSION)
    ).toBe("none");
  });
});
