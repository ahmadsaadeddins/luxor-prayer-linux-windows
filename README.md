# Prayer Luxor Desktop

Luxor prayer times countdown widget for Linux and Windows (Tauri 2 + React).

## Requirements

- Node.js 18+
- Rust / Cargo
- Linux: `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev` (Ubuntu)

## Development

```bash
npm install
npm run tauri dev
```

## Install launcher (.desktop)

After building:

```bash
npm run tauri build
npm run install-desktop
```

This installs `~/.local/share/applications/prayer-luxor.desktop` so the app appears in the Ubuntu app menu.

Installing the `.deb` bundle also registers the launcher system-wide.

## Usage

- **Compact widget**: next prayer label + countdown (always on top)
- **Click widget**: expand to full prayer list + settings
- **× or Escape**: hide to system tray (app keeps running)
- **Tray menu**: show widget, toggle autostart, quit

Prayer logic copied from [prayer-luxor-react](https://github.com/ahmad-saadeddin/prayer-luxor-react).
