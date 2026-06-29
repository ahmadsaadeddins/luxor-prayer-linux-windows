import { convertToArabic } from "../utils/format";

interface WidgetFaceProps {
  prefix: string;
  target: string;
  timeText: string;
  isIqamaWindow: boolean;
  useArabicNumerals: boolean;
  onExpand: () => void;
}

export function WidgetFace({
  prefix,
  target,
  timeText,
  isIqamaWindow,
  useArabicNumerals,
  onExpand,
}: WidgetFaceProps) {
  return (
    <div
      className="widget-face"
      data-tauri-drag-region
      onDoubleClick={onExpand}
      role="button"
      tabIndex={0}
    >
      <button
        type="button"
        className="widget-close"
        title="إخفاء"
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent("luxor-hide-window"));
        }}
      >
        ×
      </button>

      <div className="widget-content">
        <p className={`widget-label ${isIqamaWindow ? "iqama" : ""}`}>
          {prefix} {target}
        </p>
        <p className={`widget-time ${isIqamaWindow ? "iqama" : ""}`}>
          {convertToArabic(timeText, useArabicNumerals)}
        </p>
      </div>
    </div>
  );
}
