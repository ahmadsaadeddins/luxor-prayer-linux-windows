type TimerStatus = "idle" | "running" | "paused" | "finished";

export interface TimerState {
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
}

type Listener = (state: TimerState) => void;

const MINUTE = 60_000;
const HOUR = 3_600_000;

let state: TimerState = { status: "idle", durationMs: 5 * MINUTE, remainingMs: 5 * MINUTE };
const listeners = new Set<Listener>();
let intervalId: number | null = null;
let endAt = 0;

// --- Audio alarm ---
let audioCtx: AudioContext | null = null;
let alarmNodes: AudioScheduledSourceNode[] = [];

function ensureAudio() {
  if (audioCtx) return;
  const Ctx: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (Ctx) audioCtx = new Ctx();
}

function resumeAudio() {
  void audioCtx?.resume?.();
}

function beep(at: number, freq: number, dur: number) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(0.9, at + 0.02);
  gain.gain.setValueAtTime(0.9, at + dur - 0.05);
  gain.gain.linearRampToValueAtTime(0, at + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.03);
  alarmNodes.push(osc);
}

function playAlarm() {
  ensureAudio();
  if (!audioCtx) return;
  resumeAudio();
  stopAlarm();
  const t0 = audioCtx.currentTime;
  let t = t0;
  const pattern = [880, 660, 880, 660];
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const freq of pattern) {
      beep(t, freq, 0.35);
      t += 0.45;
    }
    t += 0.35;
  }
}

export function stopAlarm() {
  alarmNodes.forEach((n) => {
    try {
      n.stop();
    } catch {
      /* already stopped */
    }
    try {
      n.disconnect();
    } catch {
      /* ignore */
    }
  });
  alarmNodes = [];
}

// --- Store ---
function emit() {
  listeners.forEach((l) => l(state));
}

function set(patch: Partial<TimerState>) {
  state = { ...state, ...patch };
  emit();
}

function stopInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function tick() {
  const remaining = Math.max(0, endAt - Date.now());
  set({ remainingMs: remaining });
  if (remaining <= 0) finish();
}

function finish() {
  stopInterval();
  set({ status: "finished", remainingMs: 0 });
  playAlarm();
  window.dispatchEvent(new CustomEvent("luxor-timer-finished"));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export function startTimer(ms: number) {
  if (ms <= 0) return;
  stopInterval();
  ensureAudio();
  resumeAudio();
  set({ status: "running", durationMs: ms, remainingMs: ms });
  endAt = Date.now() + ms;
  intervalId = window.setInterval(tick, 200);
}

export function addTime(ms: number) {
  if (state.status === "finished" || state.status === "running") return;
  const next = Math.max(0, state.remainingMs + ms);
  set({ status: next > 0 ? "idle" : "idle", durationMs: next, remainingMs: next });
}

export function pauseTimer() {
  if (state.status !== "running") return;
  stopInterval();
  set({ status: "paused", remainingMs: Math.max(0, endAt - Date.now()) });
}

export function resumeTimer() {
  if (state.status !== "paused") return;
  resumeAudio();
  set({ status: "running" });
  endAt = Date.now() + state.remainingMs;
  intervalId = window.setInterval(tick, 200);
}

export function resetTimer() {
  stopInterval();
  stopAlarm();
  set({ status: "idle", durationMs: 5 * MINUTE, remainingMs: 5 * MINUTE });
}

export { MINUTE, HOUR };
