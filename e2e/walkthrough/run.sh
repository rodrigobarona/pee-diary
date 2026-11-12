#!/usr/bin/env bash
# Record the end-to-end walkthrough (screenshots and one video per chapter)
# on a running Android emulator or iOS simulator with a release build of
# the app installed.
#
#   e2e/walkthrough/run.sh android            # first adb device
#   e2e/walkthrough/run.sh ios <simulator-udid>
#
# Needs Maestro (~/.maestro/bin/maestro), Python 3 and Pillow. Output goes to
# walkthrough-output/<platform>/ (git-ignored).
set -euo pipefail

PLATFORM=${1:?android or ios}
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
OUT="$ROOT/walkthrough-output/$PLATFORM"
MAESTRO=${MAESTRO:-$HOME/.maestro/bin/maestro}
BACKUP=$(mktemp -d)/eleva-diary-demo-backup.json

python3 "$HERE/make-demo-backup.py" "$BACKUP"
# The flows open the demo's second day, three days ago
DAY_KEY=$(python3 -c 'import datetime as d; print((d.datetime.now(d.timezone.utc).date()-d.timedelta(days=3)).isoformat())')
DAY=$((10#${DAY_KEY:8:2}))

case "$PLATFORM" in
  android)
    ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
    DEVICE=$("$ADB" devices | awk 'NR>1 && $2=="device" {print $1; exit}')
    "$ADB" -s "$DEVICE" push "$BACKUP" /sdcard/Download/ >/dev/null
    # Index the file so the system file picker lists it
    "$ADB" -s "$DEVICE" shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE \
      -d file:///sdcard/Download/eleva-diary-demo-backup.json >/dev/null
    # Clean status bar: demo mode at 9:41, full signal and battery
    "$ADB" -s "$DEVICE" shell settings put global sysui_demo_allowed 1
    demo() { "$ADB" -s "$DEVICE" shell am broadcast -a com.android.systemui.demo -e command "$@" >/dev/null; }
    demo enter
    demo clock -e hhmm 0941
    demo battery -e level 100 -e plugged false
    demo network -e wifi show -e level 4
    demo network -e mobile show -e datatype none -e level 4
    demo notifications -e visible false
    ;;
  ios)
    DEVICE=${2:?simulator UDID}
    DOCS=$(xcrun simctl get_app_container "$DEVICE" com.apple.DocumentsApp groups \
      | awk '/FileProvider.LocalStorage/ {print $2}')
    mkdir -p "$DOCS/File Provider Storage"
    cp "$BACKUP" "$DOCS/File Provider Storage/"
    xcrun simctl status_bar "$DEVICE" override --time "9:41" --batteryState charged \
      --batteryLevel 100 --cellularBars 4 --wifiBars 3 --dataNetwork wifi
    ;;
  *) echo "android or ios" >&2; exit 1 ;;
esac

rm -rf "$OUT" && mkdir -p "$OUT"
cd "$HERE/flows"
"$MAESTRO" --device "$DEVICE" test -e DAY="$DAY" -e DAY_KEY="$DAY_KEY" \
  w1-onboarding.yaml w2-restore.yaml w3-browse.yaml w4-add.yaml w5-settings.yaml \
  --test-output-dir "$OUT"
