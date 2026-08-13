import { useEffect, useState } from "react";
import {
  HOUR,
  MINUTE,
  addTime,
  pauseTimer,
  resetTimer,
  resumeTimer,
  startTimer,
  stopAlarm,
  subscribe,
  type TimerState,
} from "../utils/timer";
import { convertToArabic } from "../utils/format";

interface TimerProps {
  useArabicNumerals: boolean;
  onBack: () => void;
}

function formatTime(ms: number, useArabic: boolean): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const text = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return convertToArabic(text, useArabic);
}

const PRESETS: { label: string; ms: number }[] = [
  { label: "1 د", ms: MINUTE },
  { label: "5 د", ms: 5 * MINUTE },
  { label: "10 د", ms: 10 * MINUTE },
  { label: "30 د", ms: 30 * MINUTE },
  { label: "1 س", ms: HOUR },
];

export function Timer({ useArabicNumerals, onBack }: TimerProps) {
  const [timer, setTimer] = useState<TimerState>({
    status: "idle",
    durationMs: 5 * MINUTE,
    remainingMs: 5 * MINUTE,
  });

  useEffect(() => subscribe(setTimer), []);

  const num = (n: number) => convertToArabic(n, useArabicNumerals);
  const progress =
    timer.durationMs > 0 ? timer.remainingMs / timer.durationMs : 0;

  const primaryAction = () => {
    if (timer.status === "running") pauseTimer();
    else if (timer.status === "paused") resumeTimer();
    else if (timer.status === "idle") startTimer(timer.remainingMs);
    else resetTimer();
  };

  const primaryLabel =
    timer.status === "running"
      ? "إيقاف مؤقت"
      : timer.status === "paused"
        ? "استئناف"
        : timer.status === "finished"
          ? "إعادة"
          : "بدء";

  return (
    <div className="timer-panel">
      <div className="panel-header" data-tauri-drag-region>
        <button type="button" className="azkar-nav" onClick={onBack} title="رجوع">
          →
        </button>
        <span className="azkar-title">مؤقّت</span>
        <span style={{ width: 30 }} />
      </div>

      <div className="timer-body">
        <div className="timer-display">{formatTime(timer.remainingMs, useArabicNumerals)}</div>

        {timer.status !== "finished" && (
          <div className="timer-progress">
            <div
              className="timer-progress-fill"
              style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
            />
          </div>
        )}

        {timer.status === "finished" && (
          <div className="timer-finished">
            <div className="timer-finished-icon">🔔</div>
            <p>انتهى الوقت!</p>
            <button
              type="button"
              className="timer-btn timer-btn-primary"
              onClick={() => {
                stopAlarm();
                resetTimer();
              }}
            >
              إيقاف الصوت
            </button>
          </div>
        )}

        {timer.status !== "finished" && (
          <>
            <div className="timer-presets">
              {PRESETS.map((p) => (
                <button
                  key={`add-${p.label}`}
                  type="button"
                  className="timer-preset"
                  disabled={timer.status === "running"}
                  onClick={() => addTime(p.ms)}
                >
                  +{p.label}
                </button>
              ))}
            </div>

            <div className="timer-presets">
              {PRESETS.map((p) => (
                <button
                  key={`sub-${p.label}`}
                  type="button"
                  className="timer-preset timer-preset-minus"
                  disabled={timer.status === "running" || timer.remainingMs <= p.ms}
                  onClick={() => addTime(-p.ms)}
                >
                  −{p.label}
                </button>
              ))}
            </div>

            <div className="timer-actions">
              <button
                type="button"
                className="timer-btn timer-btn-primary"
                disabled={timer.remainingMs <= 0}
                onClick={primaryAction}
              >
                {primaryLabel}
              </button>
              <button
                type="button"
                className="timer-btn"
                disabled={timer.status === "running" || timer.status === "idle"}
                onClick={resetTimer}
              >
                تصفير
              </button>
            </div>

            <p className="timer-hint">
              الافتراضي {num(5)} دقائق — اضغط «بدء» أو أضف وقتاً بالأزرار
            </p>
          </>
        )}
      </div>
    </div>
  );
}
