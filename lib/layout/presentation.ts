import * as React from "react";
import { Dimensions, Platform } from "react-native";

import { widthClassFor } from "@/lib/layout/window-class";

const dialogByRoute = new Map<string, boolean>();

/**
 * Whether this screen (its route key) is presented as a centred dialog
 * instead of a full-screen page (forms) or a bottom sheet (sheets).
 *
 * Android only: on a window 600 wide or more (unfolded foldables, tablets)
 * Material asks that small tasks do not cover the whole screen and that
 * sheets are not full width. iOS centres its sheets on wide windows itself.
 *
 * Decided once, when the screen is first presented, and kept for its
 * lifetime: folding or unfolding with a form open must not change how the
 * screen under the user's fingers is presented (DialogFrame then adapts).
 */
export function presentsAsDialog(routeKey: string): boolean {
  let dialog = dialogByRoute.get(routeKey);
  if (dialog === undefined) {
    dialog =
      Platform.OS === "android" &&
      widthClassFor(Dimensions.get("window").width) !== "compact";
    dialogByRoute.set(routeKey, dialog);
  }
  return dialog;
}

/** True inside a DialogFrame: sheets hide their drag handle there. */
export const InDialogContext = React.createContext(false);
