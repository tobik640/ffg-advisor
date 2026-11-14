#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist/assets
cat payload/index.html.gz.b64.part* | base64 -d | gzip -dc > dist/index.html
# Use the SVG app icon for Apple touch icon; keep the published bundle self-contained.
sed -i 's#./assets/icon-192.png#./assets/icon.svg#g' dist/index.html
cp manifest.webmanifest sw.js dist/
cp assets/icon.svg dist/assets/icon.svg
echo "FFG Advisor build complete"
