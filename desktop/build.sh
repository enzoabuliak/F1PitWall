#!/usr/bin/env bash
# Build "F1 Pit Wall.app" — a tiny native WKWebView shell around the
# live GitHub Pages dashboard.
#
# Usage:
#   ./desktop/build.sh                  # builds to desktop/dist/
#   F1PITWALL_OUT=~/Applications ./desktop/build.sh
#
# Requires: Xcode command line tools (`xcode-select --install`).

set -euo pipefail

DESKTOP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${F1PITWALL_OUT:-$DESKTOP_DIR/dist}"
APP_NAME="F1 Pit Wall"
APP_BUNDLE="$OUT_DIR/$APP_NAME.app"
EXEC_NAME="F1PitWall"

mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

echo "▸ compiling Swift binary (universal arm64 + x86_64)"
xcrun -sdk macosx swiftc \
    -O \
    -target arm64-apple-macos11 \
    -o "$APP_BUNDLE/Contents/MacOS/${EXEC_NAME}_arm64" \
    "$DESKTOP_DIR/main.swift"

xcrun -sdk macosx swiftc \
    -O \
    -target x86_64-apple-macos11 \
    -o "$APP_BUNDLE/Contents/MacOS/${EXEC_NAME}_x86_64" \
    "$DESKTOP_DIR/main.swift"

lipo -create \
    "$APP_BUNDLE/Contents/MacOS/${EXEC_NAME}_arm64" \
    "$APP_BUNDLE/Contents/MacOS/${EXEC_NAME}_x86_64" \
    -output "$APP_BUNDLE/Contents/MacOS/$EXEC_NAME"

rm "$APP_BUNDLE/Contents/MacOS/${EXEC_NAME}_arm64" "$APP_BUNDLE/Contents/MacOS/${EXEC_NAME}_x86_64"

cp "$DESKTOP_DIR/Info.plist" "$APP_BUNDLE/Contents/Info.plist"

if [[ -f "$DESKTOP_DIR/AppIcon.icns" ]]; then
    cp "$DESKTOP_DIR/AppIcon.icns" "$APP_BUNDLE/Contents/Resources/AppIcon.icns"
fi

# Ad-hoc sign so the binary will launch without Gatekeeper complaints when
# the user just downloads the .app from a friend (or moves it to /Applications).
codesign --force --deep --sign - "$APP_BUNDLE" >/dev/null

echo "✓ built: $APP_BUNDLE"
echo "  open it with:  open \"$APP_BUNDLE\""
