#!/usr/bin/env bash
# Builds the folder that gets published (_site). Only the files visitors need go in,
# so tests, package files and workflow files never reach the live site.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf _site && mkdir _site
cp -r index.html report.html style.css script.js report.js diagrams.js CNAME assets blog cases _site/

# Stamp the CSS and JS links with the version (the commit id in CI). When a file changes, the link
# changes too, so visitors' browsers fetch the new file instead of showing an old cached one.
VERSION="${GITHUB_SHA:-$(date +%s)}"
VERSION="${VERSION:0:7}"
find _site -name '*.html' -exec sed -i -E \
  "s#(href=\"(\.\./)?style\.css)\"#\1?v=${VERSION}\"#; s#(src=\"(\.\./)?(script|report|diagrams)\.js)\"#\1?v=${VERSION}\"#" {} +

echo "Built _site (version ${VERSION}): $(find _site -type f | wc -l) files"
