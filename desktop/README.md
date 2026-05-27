# F1 Pit Wall · macOS .app

Tiny native shell that wraps the live GitHub Pages dashboard
(`https://enzoabuliak.github.io/F1PitWall/`) in a chromeless macOS
window powered by `WKWebView`.

- ~250 KB universal binary (arm64 + x86_64), macOS 11+
- Pure Swift, no Xcode project, no Electron
- Cmd-R to reload · Cmd-0 to go home · Cmd-Ctrl-F to fullscreen
- External links open in your default browser; the app stays on the dashboard

## Download

A prebuilt universal binary is committed at
[`desktop/dist/F1 Pit Wall.app`](dist/) — clone the repo and double-click
the `.app`, or:

```bash
cp -R "desktop/dist/F1 Pit Wall.app" /Applications/
open "/Applications/F1 Pit Wall.app"
```

## Build

```bash
cd desktop
./build.sh
open "dist/F1 Pit Wall.app"
```

Requires Xcode command line tools (`xcode-select --install`).

To install for everyday use:

```bash
F1PITWALL_OUT=~/Applications ./build.sh
open ~/Applications/"F1 Pit Wall.app"
```

## Point at a different URL

Set `F1PITWALL_URL` before launching to override the bundled URL — handy
for local dev:

```bash
F1PITWALL_URL="http://localhost:3000" open -a "F1 Pit Wall"
```

## What's inside

- `main.swift` — `NSApplication` + `WKWebView`, custom menu bar with
  Reload / Home / Fullscreen, link-out handler, ad-hoc code signing
- `Info.plist` — bundle metadata, ATS allows arbitrary loads so the
  user can point the app at a local dev server
- `build.sh` — compiles arm64 + x86_64, lipos into a universal
  binary, assembles the `.app` bundle, signs ad-hoc

If you add `AppIcon.icns` to this folder it'll be picked up automatically.
