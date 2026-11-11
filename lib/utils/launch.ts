/**
 * What the app does once the stored data has loaded at launch. Kept pure so
 * the rules can be tested without rendering the navigator.
 */

export type LaunchAction =
  // First launch, or the tutorial was being replayed: show the welcome
  // screens, which end with the Terms of Use acceptance.
  | "onboarding"
  // The Terms of Use accepted on this device are not the current version
  // (or none was recorded): show the terms-update notice. It replaces the
  // add-menu auto-open for this launch, so the two never stack.
  | "termsUpdate"
  // The user asked for the add menu to open at launch.
  | "addMenu"
  | "none";

export interface LaunchState {
  hasCompletedOnboarding: boolean;
  termsAcceptedVersion: string | null;
  openAddMenuOnLaunch: boolean;
}

/** True when the device has not accepted the current Terms of Use. */
export function needsTermsAcceptance(
  termsAcceptedVersion: string | null,
  currentTermsVersion: string
): boolean {
  return termsAcceptedVersion !== currentTermsVersion;
}

export function getLaunchAction(
  state: LaunchState,
  currentTermsVersion: string
): LaunchAction {
  if (!state.hasCompletedOnboarding) {
    return "onboarding";
  }
  if (needsTermsAcceptance(state.termsAcceptedVersion, currentTermsVersion)) {
    return "termsUpdate";
  }
  return state.openAddMenuOnLaunch ? "addMenu" : "none";
}
