#!/usr/bin/env bash
set -euo pipefail

# Keep older releases for rollback; the v0.6 release is a focused UI refresh.
mkdir -p dist/assets
base64 -d payload/index.v06.html.gz.b64 | gzip -dc > dist/index.html
# Keep the install icon consistent with the committed assets.
sed -i 's#./assets/icon-192.png#./assets/icon.svg#g' dist/index.html

cp advisor-v05.js charts-v05.js redesign-v06.css workspace-v06.js manifest.webmanifest sw.js dist/
cp assets/icon.svg dist/assets/
for asset in icon-192.png icon-512.png; do
  if [[ -f "assets/$asset" ]]; then cp "assets/$asset" dist/assets/; fi
done
echo "FFG Advisor v0.6 build complete"

