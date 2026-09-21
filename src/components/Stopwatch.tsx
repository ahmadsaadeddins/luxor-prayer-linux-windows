import { useEffect, useRef, useState } from "react";
import { convertToArabic } from "../utils/format";

interface StopwatchProps {
  useArabicNumerals: boolean;
  onBack: () => void;
}

interface SavedRecord {
  id: number;
  name: string;
  ms: number;
  savedAt: number;
}

const STORAGE_KEY = "luxor-stopwatch-saved";

function formatTime(ms: number, useArabic: boolean): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const cs = Math.floor((ms % 1000) / 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  const text =
    h > 0
      ? `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`
      : `${pad(m)}:${pad(s)}.${pad(cs)}`;
  return convertToArabic(text, useArabic);
}

function formatSavedAt(ts: number, useArabic: boolean): string {
  const d = new Date(ts);
  const text = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return convertToArabic(text, useArabic);
}

function loadSaved(): SavedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedRecord[]) : [];
  } catch {
    return [];
  }
}

export function Stopwatch({ useArabicNumerals, onBack }: StopwatchProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<SavedRecord[]>(() => loadSaved());

  const startRef = useRef(0);
  const baseRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      startRef.current = performance.now();
      const tick = () => {
        const now = performance.now();
        setElapsed(baseRef.current + (now - startRef.current));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const toggle = () => {
    if (running) {
      baseRef.current = elapsed;
      setRunning(false);
    } else {
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    baseRef.current = 0;
    setElapsed(0);
  };

  const save = () => {
    const record: SavedRecord = {
      id: Date.now(),
      name: name.trim() || `تسجيل ${saved.length + 1}`,
      ms: elapsed,
      savedAt: Date.now(),
    };
    const next = [record, ...saved];
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setName("");
  };

  const remove = (id: number) => {
    const next = saved.filter((r) => r.id !== id);
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const num = (n: number) => convertToArabic(n, useArabicNumerals);

  return (
    <div className="stopwatch-panel">
      <div className="panel-header" data-tauri-drag-region>
        <button type="button" className="azkar-nav" onClick={onBack} title="رجوع">
          →
        </button>
        <span className="azkar-title">ساعة إيقاف</span>
        <span style={{ width: 30 }} />
      </div>

      <div className="stopwatch-body">
        <div className="stopwatch-display">{formatTime(elapsed, useArabicNumerals)}</div>

        <div className="stopwatch-actions">
          <button
            type="button"
            className="timer-btn timer-btn-primary"
            onClick={toggle}
          >
            {running ? "إيقاف مؤقت" : "تشغيل"}
          </button>
          <button type="button" className="timer-btn" onClick={reset}>
            تصفير
          </button>
        </div>

        <div className="stopwatch-save">
          <input
            type="text"
            className="stopwatch-name-input"
            placeholder="اسم التسجيل"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            className="timer-btn stopwatch-save-btn"
            disabled={elapsed <= 0}
            onClick={save}
          >
            حفظ
          </button>
        </div>

        <div className="stopwatch-saved">
          {saved.length === 0 && (
            <p className="stopwatch-empty">لا توجد تسجيلات محفوظة</p>
          )}
          {saved.map((r) => (
            <div key={r.id} className="stopwatch-record">
              <div className="stopwatch-record-info">
                <span className="stopwatch-record-name">{r.name}</span>
                <span className="stopwatch-record-time">
                  {formatTime(r.ms, useArabicNumerals)}
                  <span className="stopwatch-record-at"> · {formatSavedAt(r.savedAt, useArabicNumerals)}</span>
                </span>
              </div>
              <button
                type="button"
                className="stopwatch-record-del"
                title="حذف"
                onClick={() => remove(r.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <p className="timer-hint">
          {num(0)} — اضغط «تشغيل» للبدء و«تصفير» للإعادة
        </p>
      </div>
    </div>
  );
}
