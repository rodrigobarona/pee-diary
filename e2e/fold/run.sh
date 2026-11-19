#!/usr/bin/env bash
# Fold continuity test on an Android emulator (Google Play's Tier 3 check):
# open a form at phone width, type, then "unfold", rotate and "fold" by
# changing the screen size, and check the form and its values survive each
# change. Run after the walkthrough (it needs onboarding done).
#
#     e2e/fold/run.sh            # screenshots in walkthrough-output/fold-continuity/
#
# Screen sizes at the emulator's 420 dpi: 1080x2400 phone (411 dp wide),
# 1768x2208 unfolded portrait (673 dp), 2208x1768 unfolded landscape (841 dp).
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
OUT="$ROOT/walkthrough-output/fold-continuity"
MAESTRO=${MAESTRO:-$HOME/.maestro/bin/maestro}
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
mkdir -p "$OUT"
trap '"$ADB" shell wm size reset' EXIT

"$ADB" shell wm size reset
"$MAESTRO" test --test-output-dir "$OUT" "$HERE/flows/open-form.yaml"
for step in 2-unfolded:1768x2208 3-landscape:2208x1768 4-folded:reset; do
  name=${step%%:*}; size=${step#*:}
  "$ADB" shell wm size "$size"
  sleep 2
  "$MAESTRO" test --test-output-dir "$OUT" -e STEP="$name" "$HERE/flows/check-form.yaml"
done

# The onboarding pager stays on its page when the page width changes
"$ADB" shell wm size reset
"$MAESTRO" test --test-output-dir "$OUT" "$HERE/flows/open-tutorial.yaml"
for step in 6-tutorial-unfolded:1768x2208 7-tutorial-landscape:2208x1768 8-tutorial-folded:reset; do
  name=${step%%:*}; size=${step#*:}
  "$ADB" shell wm size "$size"
  sleep 2
  "$MAESTRO" test --test-output-dir "$OUT" -e STEP="$name" "$HERE/flows/check-tutorial.yaml"
done
echo "Fold continuity: passed ($OUT)"
