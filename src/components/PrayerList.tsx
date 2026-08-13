import { PRAYER_NAMES, PRAYER_NAMES_ARABIC } from "../utils/constants.js";
import { todayAndTomorrow } from "../utils/prayerTimes";
import { formatClockTime } from "../utils/format";
import type { AppSettings } from "../utils/settings";

interface PrayerListProps {
  settings: AppSettings;
  onSettingsChange: (patch: Partial<AppSettings>) => void;
  onCollapse: () => void;
  onOpenAzkar: () => void;
  onOpenTimer: () => void;
}

export function PrayerList({
  settings,
  onSettingsChange,
  onCollapse,
  onOpenAzkar,
  onOpenTimer,
}: PrayerListProps) {
  const { today, todayPrayers, tomorrowPrayers } = todayAndTomorrow(settings.daylight);
  const dateStr = today.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="prayer-list-panel">
      <div className="panel-header" data-tauri-drag-region>
        <span>مواقيت الأقصر</span>
        <div className="panel-header-actions">
          <button type="button" className="panel-action" onClick={onOpenTimer} title="مؤقّت">
            مؤقّت
          </button>
          <button type="button" className="panel-action" onClick={onOpenAzkar} title="الأذكار">
            الأذكار
          </button>
          <button type="button" className="panel-close" onClick={onCollapse} title="إغلاق">
            ×
          </button>
        </div>
      </div>

      <p className="panel-date">{dateStr}</p>

      <ul className="prayer-rows">
        {todayPrayers.map((time, i) => (
          <li key={PRAYER_NAMES[i]} className="prayer-row">
            <span className="prayer-name">{PRAYER_NAMES_ARABIC[i]}</span>
            <span className="prayer-time">
              {formatClockTime(time, settings.useArabicNumerals)}
            </span>
            <label className="iqama-field">
              <span>إقامة</span>
              <input
                type="number"
                min={0}
                max={60}
                value={settings.iqamaOffsets[i]}
                onChange={(e) => {
                  const next = [...settings.iqamaOffsets];
                  next[i] = Number(e.target.value) || 0;
                  onSettingsChange({ iqamaOffsets: next });
                }}
              />
            </label>
          </li>
        ))}
        <li className="prayer-row tomorrow">
          <span className="prayer-name">فجر الغد</span>
          <span className="prayer-time">
            {tomorrowPrayers[0]
              ? formatClockTime(tomorrowPrayers[0], settings.useArabicNumerals)
              : "—"}
          </span>
        </li>
      </ul>

      <div className="panel-toggles">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.daylight}
            onChange={(e) => onSettingsChange({ daylight: e.target.checked })}
          />
          <span>التوقيت الصيفي</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.useArabicNumerals}
            onChange={(e) => onSettingsChange({ useArabicNumerals: e.target.checked })}
          />
          <span>أرقام هندية (٠–٩)</span>
        </label>
      </div>
    </div>
  );
}
