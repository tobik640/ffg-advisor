#!/usr/bin/env bash
set -euo pipefail

# The previous v0.3 payload is deliberately retained in git for rollback.
mkdir -p dist/assets
base64 -d payload/index.v05.html.gz.b64 | gzip -dc > dist/index.html
# Keep the install icon consistent with the committed assets.
sed -i 's#./assets/icon-192.png#./assets/icon.svg#g' dist/index.html

cp advisor-v05.js charts-v05.js ioldp-parser-v05.js manifest.webmanifest sw.js dist/
cp assets/icon.svg assets/icon-192.png assets/icon-512.png dist/assets/
echo "FFG Advisor v0.5 build complete"
