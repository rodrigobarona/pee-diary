import * as React from "react";
import { Dimensions, Platform } from "react-native";

import { widthClassFor } from "@/lib/layout/window-class";

const dialogByRoute = new Map<string, boolean>();
// Screens remembered at most; older ones are long closed (keys are unique)
const MAX_REMEMBERED = 50;

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
 *
 * `wide`: whether the window is wide (useWindowClass), passed by the root
 * layout, which decides first; the window size is the fallback.
 */
export function presentsAsDialog(routeKey: string, wide?: boolean): boolean {
  let dialog = dialogByRoute.get(routeKey);
  if (dialog === undefined) {
    dialog =
      Platform.OS === "android" &&
      (wide ?? widthClassFor(Dimensions.get("window").width) !== "compact");
    dialogByRoute.set(routeKey, dialog);
    if (dialogByRoute.size > MAX_REMEMBERED) {
      // Maps keep insertion order: forget the oldest screen
      dialogByRoute.delete(dialogByRoute.keys().next().value as string);
    }
  }
  return dialog;
}

/** True inside a DialogFrame: sheets hide their drag handle there. */
export const InDialogContext = React.createContext(false);
