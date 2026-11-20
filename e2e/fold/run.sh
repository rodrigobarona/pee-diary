#!/usr/bin/env bash
# Fold continuity test on an Android emulator (Google Play's Tier 3 check):
# open a form folded, type, then unfold, rotate and fold again, and check the
# form and its values survive each change; then the same for the onboarding
# pager. Run after the walkthrough (it needs onboarding done).
#
#     e2e/fold/run.sh                 # any emulator: screen size changes
#     FOLD_MODE=hinge e2e/fold/run.sh # a foldable AVD: real fold events
#     FOLD_MODE=window e2e/fold/run.sh # a freeform window resized, as split
#                                      # screen and desktop windows do
#
# Size mode, at the emulator's 420 dpi: 1080x2400 phone (411 dp wide),
# 1768x2208 unfolded portrait (673 dp), 2208x1768 unfolded landscape (841 dp).
# Hinge mode (e.g. the Pixel Fold AVD): `adb emu fold`, `unfold`, `rotate`.
# Screenshots go to walkthrough-output/fold-continuity[-hinge]/.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
MODE=${FOLD_MODE:-size}
OUT="$ROOT/walkthrough-output/fold-continuity$([ "$MODE" != size ] && echo "-$MODE" || true)"
MAESTRO=${MAESTRO:-$HOME/.maestro/bin/maestro}
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
mkdir -p "$OUT"

APP=care.eleva.peediary
TASK=""
# Window mode: the app in a freeform window whose size the test sets
start_window() {
  "$ADB" shell am force-stop $APP
  "$ADB" shell am start -n $APP/.MainActivity --windowingMode 5 >/dev/null
  sleep 5
  TASK=$("$ADB" shell am stack list | grep -m1 "$APP" | sed -E 's/.*taskId=([0-9]+).*/\1/')
  # The display's size, from the largest window it allows
  read -r DW DH < <("$ADB" shell dumpsys activity activities \
    | grep -m1 -o 'mMaxBounds=Rect(0, 0 - [0-9]*, [0-9]*)' | sed -E 's/.* - ([0-9]+), ([0-9]+)\)/\1 \2/')
}
if [ "$MODE" = window ]; then
  "$ADB" shell settings put global enable_freeform_support 1
  "$ADB" shell settings put global force_resizable_activities 1
fi

# change folded | unfolded | rotated (window mode: narrow | medium | wide)
change() {
  if [ "$MODE" = window ]; then
    # Widths at 420 dpi: 1050 px = 400 dp, 1700 px = 647 dp, the display
    case $1 in
      folded) "$ADB" shell am task resize "$TASK" 0 0 1050 $((DH * 9 / 10)) ;;
      unfolded) "$ADB" shell am task resize "$TASK" 0 0 $((DW < 1700 ? DW : 1700)) $((DH * 9 / 10)) ;;
      rotated) "$ADB" shell am task resize "$TASK" 0 0 "$DW" $((DH * 9 / 10)) ;;
    esac
  elif [ "$MODE" = hinge ]; then
    case $1 in
      folded) "$ADB" emu fold >/dev/null ;;
      unfolded) "$ADB" emu unfold >/dev/null ;;
      rotated) "$ADB" emu rotate >/dev/null ;;
    esac
  else
    case $1 in
      folded) "$ADB" shell wm size reset ;;
      unfolded) "$ADB" shell wm size 1768x2208 ;;
      rotated) "$ADB" shell wm size 2208x1768 ;;
    esac
  fi
  sleep 1
}
if [ "$MODE" = window ]; then
  trap '"$ADB" shell am force-stop '$APP'' EXIT
elif [ "$MODE" = hinge ]; then
  trap '"$ADB" emu unfold >/dev/null' EXIT
else
  trap '"$ADB" shell wm size reset' EXIT
fi

check() { # flow step-name
  "$MAESTRO" test --test-output-dir "$OUT" -e STEP="$2" "$HERE/flows/$1"
}

[ "$MODE" = window ] && start_window
change folded
"$MAESTRO" test --test-output-dir "$OUT" -e RELAUNCH="$([ "$MODE" = window ] && echo false || echo true)" "$HERE/flows/open-form.yaml"
for step in unfolded rotated folded; do
  change $step
  check check-form.yaml "form-$step"
done

# The onboarding pager stays on its page when the page width changes
[ "$MODE" = window ] && start_window
change folded
"$MAESTRO" test --test-output-dir "$OUT" -e RELAUNCH="$([ "$MODE" = window ] && echo false || echo true)" "$HERE/flows/open-tutorial.yaml"
for step in unfolded rotated folded; do
  change $step
  check check-tutorial.yaml "tutorial-$step"
done
echo "Fold continuity ($MODE): passed ($OUT)"
