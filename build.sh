#!/usr/bin/env bash
set -euo pipefail

# Build the readable single-page application for Cloudflare static assets.
mkdir -p dist/assets
cp index.html dist/index.html
# Keep the install icon consistent with the committed assets.
sed -i 's#./assets/icon-192.png#./assets/icon.svg#g' dist/index.html

cp advisor-v05.js charts-v05.js redesign-v06.css redesign-v08.css redesign-v09.css workspace-v06.js workspace-v08.js workspace-v09.js product-binding-v10.js rate-products-v07.js range-controls-v07.js manifest.webmanifest sw.js dist/
cp assets/icon.svg dist/assets/
for asset in icon-192.png icon-512.png; do
  if [[ -f "assets/$asset" ]]; then cp "assets/$asset" dist/assets/; fi
done
echo "FFG Advisor v1.0 build complete"

