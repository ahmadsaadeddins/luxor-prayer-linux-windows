# Tauri 2 + React for cross-platform desktop widget

The desktop widget targets Ubuntu Linux and Windows from one codebase, with prayer-time logic already implemented in `prayer-luxor-react`. We chose **Tauri 2 with a React frontend** over Electron, Python/Qt, and Flutter.

Tauri reuses the existing React utilities (`prayers366`, countdown hooks) with minimal porting, produces a small binary suitable for an always-on widget, and supports frameless always-on-top windows on both platforms. Electron was rejected for bundle size; Python/Qt and Flutter would require rewriting proven prayer logic.
