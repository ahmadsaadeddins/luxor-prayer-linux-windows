import { useCallback, useEffect, useRef, useState } from "react";
import { AZKAR_DATA, type AzkarItem } from "../utils/azkar-data";
import { convertToArabic } from "../utils/format";

type Tab = "morning" | "evening";

interface AzkarProps {
  useArabicNumerals: boolean;
  onBack: () => void;
}

interface ItemState {
  currentCount: number;
  isCompleted: boolean;
}

const PROGRESS_KEYS: Record<Tab, string> = {
  morning: "luxor-azkar-progress-morning",
  evening: "luxor-azkar-progress-evening",
};
const FONT_SIZE_KEY = "luxor-azkar-font-size";

const TAB_LABELS: Record<Tab, string> = {
  morning: "أذكار الصباح",
  evening: "أذكار المساء",
};

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function Azkar({ useArabicNumerals, onBack }: AzkarProps) {
  const [tab, setTab] = useState<Tab>("morning");
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = Number(localStorage.getItem(FONT_SIZE_KEY));
    return saved >= 12 && saved <= 48 ? saved : 18;
  });
  const [states, setStates] = useState<Record<number, ItemState>>({});
  const [undo, setUndo] = useState<{ id: number; previousCount: number } | null>(null);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    buttons: { label: string; primary?: boolean; action?: () => void }[];
  } | null>(null);

  const applyFontSize = useCallback((size: number) => {
    setFontSize(size);
    localStorage.setItem(FONT_SIZE_KEY, String(size));
  }, []);

  const loadProgress = useCallback(
    (t: Tab): Record<number, ItemState> => {
      try {
        const saved = JSON.parse(localStorage.getItem(PROGRESS_KEYS[t]) || "{}");
        const result: Record<number, ItemState> = {};
        for (const item of AZKAR_DATA[t]) {
          const savedCount = Number(saved[item.id]) || 0;
          result[item.id] = {
            currentCount: Math.min(savedCount, item.count),
            isCompleted: savedCount >= item.count,
          };
        }
        return result;
      } catch {
        return seedStates(t);
      }
    },
    [],
  );

  const seedStates = useCallback((t: Tab): Record<number, ItemState> => {
    const result: Record<number, ItemState> = {};
    for (const item of AZKAR_DATA[t]) {
      result[item.id] = { currentCount: 0, isCompleted: false };
    }
    return result;
  }, []);

  useEffect(() => {
    setStates(loadProgress(tab));
    setUndo(null);
  }, [tab, loadProgress]);

  const saveProgress = useCallback(
    (t: Tab, next: Record<number, ItemState>) => {
      const progress: Record<number, number> = {};
      for (const item of AZKAR_DATA[t]) {
        progress[item.id] = next[item.id]?.currentCount || 0;
      }
      localStorage.setItem(PROGRESS_KEYS[t], JSON.stringify(progress));
    },
    [],
  );

  const updateItem = useCallback(
    (id: number, patch: Partial<ItemState>, recordUndo = false, previousCount = 0) => {
      setStates((prev) => {
        const next = { ...prev, [id]: { ...prev[id], ...patch } };
        saveProgress(tab, next);
        return next;
      });
      if (recordUndo) setUndo({ id, previousCount });
    },
    [tab, saveProgress],
  );

  const increment = useCallback(
    (item: AzkarItem) => {
      const s = states[item.id];
      if (!s || s.isCompleted) return;
      const newCount = s.currentCount + 1;
      if (newCount >= item.count) {
        updateItem(item.id, { currentCount: newCount, isCompleted: true }, true, s.currentCount);
      } else {
        updateItem(item.id, { currentCount: newCount });
      }
    },
    [states, updateItem],
  );

  const decrement = useCallback(
    (item: AzkarItem) => {
      const s = states[item.id];
      if (!s || s.currentCount <= 0) return;
      updateItem(item.id, { currentCount: s.currentCount - 1, isCompleted: false });
    },
    [states, updateItem],
  );

  const complete = useCallback(
    (item: AzkarItem) => {
      const s = states[item.id];
      if (!s || s.isCompleted) return;
      updateItem(item.id, { currentCount: item.count, isCompleted: true }, true, s.currentCount);
    },
    [states, updateItem],
  );

  const undoLast = useCallback(() => {
    if (!undo) return;
    setStates((prev) => {
      const next = {
        ...prev,
        [undo.id]: {
          currentCount: Math.max(0, undo.previousCount),
          isCompleted: false,
        },
      };
      saveProgress(tab, next);
      return next;
    });
    setUndo(null);
  }, [undo, tab, saveProgress]);

  const reset = useCallback(() => {
    const next = seedStates(tab);
    setStates(next);
    setUndo(null);
    localStorage.removeItem(PROGRESS_KEYS[tab]);
  }, [tab, seedStates]);

  // Auto-reset when all completed
  useEffect(() => {
    const items = AZKAR_DATA[tab];
    const allDone = items.length > 0 && items.every((i) => states[i.id]?.isCompleted);
    if (allDone) {
      const timer = setTimeout(() => reset(), 600);
      return () => clearTimeout(timer);
    }
  }, [states, tab, reset]);

  const activeItems = AZKAR_DATA[tab].filter((i) => !states[i.id]?.isCompleted).length;
  const total = AZKAR_DATA[tab].length;
  const num = (n: number) => convertToArabic(n, useArabicNumerals);

  return (
    <div className="azkar-panel" style={{ fontSize: `${fontSize}px` }}>
      <div className="panel-header" data-tauri-drag-region>
        <button type="button" className="azkar-nav" onClick={onBack} title="رجوع">
          →
        </button>
        <span className="azkar-title">الأذكار</span>
        <div className="azkar-tools">
          <button
            type="button"
            className="azkar-tool"
            disabled={!undo}
            onClick={undoLast}
            title="تراجع"
          >
            ↶
          </button>
          <button
            type="button"
            className="azkar-tool"
            onClick={() =>
              setDialog({
                title: "إعادة التصفير",
                message: `هل تريد إعادة تعيين عدّادات ${TAB_LABELS[tab]}؟`,
                buttons: [
                  { label: "إلغاء" },
                  { label: "نعم", primary: true, action: reset },
                ],
              })
            }
            title="إعادة التصفير"
          >
            ⟲
          </button>
          <button
            type="button"
            className="azkar-tool"
            onClick={() => applyFontSize(Math.max(12, fontSize - 1))}
            title="تصغير الخط"
          >
            −
          </button>
          <span className="azkar-font-label">{num(fontSize)}</span>
          <button
            type="button"
            className="azkar-tool"
            onClick={() => applyFontSize(Math.min(48, fontSize + 1))}
            title="تكبير الخط"
          >
            +
          </button>
        </div>
      </div>

      <div className="azkar-progress">
        المتبقّي {num(total - activeItems)} / {num(total)}
      </div>

      <div className="azkar-tabs">
        {(["morning", "evening"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`azkar-tab ${t === tab ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="azkar-list">
        {activeItems === 0 ? (
          <div className="azkar-empty">
            <div className="check">✓</div>
            <p>تم إكمال جميع الأذكار</p>
          </div>
        ) : (
          AZKAR_DATA[tab]
            .filter((i) => !states[i.id]?.isCompleted)
            .map((item) => (
              <AzkarCard
                key={item.id}
                item={item}
                count={states[item.id]?.currentCount ?? 0}
                useArabicNumerals={useArabicNumerals}
                onIncrement={() => increment(item)}
                onDecrement={() => decrement(item)}
                onComplete={() => complete(item)}
              />
            ))
        )}
      </div>

      {dialog && (
        <div className="azkar-dialog-overlay" onClick={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="azkar-dialog">
            <h2>{dialog.title}</h2>
            <p>{dialog.message}</p>
            <div className="azkar-dialog-actions">
              {dialog.buttons.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  className={`azkar-dialog-btn ${b.primary ? "primary" : "secondary"}`}
                  onClick={() => {
                    setDialog(null);
                    b.action?.();
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AzkarCardProps {
  item: AzkarItem;
  count: number;
  useArabicNumerals: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onComplete: () => void;
}

function AzkarCard({
  item,
  count,
  useArabicNumerals,
  onIncrement,
  onDecrement,
  onComplete,
}: AzkarCardProps) {
  const pressTimer = useRef<number | null>(null);
  const num = (n: number) => convertToArabic(n, useArabicNumerals);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".azkar-counter-btn")) return;
    pressTimer.current = window.setTimeout(onComplete, 600);
  };
  const cancelPress = () => {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <div
      className="azkar-card"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".azkar-counter-btn")) return;
        onIncrement();
      }}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
    >
      <div
        className="azkar-text"
        dangerouslySetInnerHTML={{ __html: escapeHtml(item.text) }}
      />
      <div className="azkar-divider" />
      <div className="azkar-counter">
        <button
          type="button"
          className="azkar-counter-btn"
          disabled={count <= 0}
          onClick={(e) => {
            e.stopPropagation();
            onDecrement();
          }}
        >
          →
        </button>
        <span className="azkar-counter-text">
          {num(count)} / {num(item.count)}
        </span>
        <button
          type="button"
          className="azkar-counter-btn"
          disabled={count >= item.count}
          onClick={(e) => {
            e.stopPropagation();
            onIncrement();
          }}
        >
          ←
        </button>
      </div>
    </div>
  );
}
