import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  availableMonitors,
  getCurrentWindow,
  LogicalPosition,
} from "@tauri-apps/api/window";
import { WidgetFace } from "./components/WidgetFace";
import { PrayerList } from "./components/PrayerList";
import { useSettings } from "./hooks/useSettings";
import { useCountdown } from "./hooks/useCountdown";
import { loadWindowPosition, saveWindowPosition } from "./utils/settings";
import "./App.css";

const COMPACT_SIZE = { width: 172, height: 50 };

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function applyWindowSize(expanded: boolean) {
  if (!isTauri()) return;
  await invoke("set_window_expanded", { expanded });
}

async function isPositionOnScreen(x: number, y: number, width: number, height: number) {
  const monitors = await availableMonitors();
  return monitors.some((m) => {
    const mx = m.position.x;
    const my = m.position.y;
    const mw = m.size.width;
    const mh = m.size.height;
    return x < mx + mw && x + width > mx && y < my + mh && y + height > my;
  });
}

async function restorePosition() {
  if (!isTauri()) return;
  const pos = loadWindowPosition();
  if (!pos) return;

  const onScreen = await isPositionOnScreen(
    pos.x,
    pos.y,
    COMPACT_SIZE.width,
    COMPACT_SIZE.height,
  );
  if (!onScreen) {
    localStorage.removeItem("luxor-window-position");
    return;
  }

  await getCurrentWindow().setPosition(new LogicalPosition(pos.x, pos.y));
}

function App() {
  const [expanded, setExpanded] = useState(false);
  const { settings, update } = useSettings();
  const countdown = useCountdown(settings);

  const collapse = useCallback(() => setExpanded(false), []);
  const expand = useCallback(() => setExpanded(true), []);

  useEffect(() => {
    applyWindowSize(expanded);
  }, [expanded]);

  useEffect(() => {
    if (!isTauri()) return;

    const win = getCurrentWindow();

    const setup = async () => {
      await applyWindowSize(false);
      await restorePosition();
    };
    void setup();

    const unlistenMoved = win.onMoved(({ payload }) => {
      saveWindowPosition({ x: payload.x, y: payload.y });
    });

    const onHide = () => {
      void win.hide();
    };
    window.addEventListener("luxor-hide-window", onHide);

    return () => {
      void unlistenMoved.then((fn) => fn());
      window.removeEventListener("luxor-hide-window", onHide);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (expanded) collapse();
        else if (isTauri()) void getCurrentWindow().hide();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, collapse]);

  if (expanded) {
    return (
      <PrayerList
        settings={settings}
        onSettingsChange={update}
        onCollapse={collapse}
      />
    );
  }

  return (
    <WidgetFace
      prefix={countdown.prefix}
      target={countdown.target}
      timeText={countdown.timeText}
      isIqamaWindow={countdown.isIqamaWindow}
      useArabicNumerals={settings.useArabicNumerals}
      onExpand={expand}
    />
  );
}

export default App;
