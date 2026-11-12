#!/usr/bin/env bash
# Sample PDF reports for the website, made by the app's own export template
# from the demo diary, in English, Portuguese and Spanish.
#
#   e2e/walkthrough/sample-report/make-all.sh <out-dir>
# writes <out-dir>/eleva-diary-sample-<en|pt|es>.pdf and -page.png
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=$(cd "${1:?out dir}" && pwd)
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
TMP=$(mktemp -d)
for locale in en pt es; do
  python3 "$HERE/../make-demo-backup.py" "$TMP/backup-$locale.json" "$locale" >/dev/null
  (cd "$HERE" && node --no-warnings --import ./register.mjs make.mjs "$TMP/backup-$locale.json" "$locale" "$TMP/report-$locale.html")
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$OUT/eleva-diary-sample-$locale.pdf" "file://$TMP/report-$locale.html" 2>/dev/null
  # First page only (A4 landscape, 2x): the page height at this width is 711 px
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=1123,711 --screenshot="$OUT/eleva-diary-sample-$locale-page.png" \
    "file://$TMP/report-$locale.html" 2>/dev/null
done
ls -la "$OUT"
