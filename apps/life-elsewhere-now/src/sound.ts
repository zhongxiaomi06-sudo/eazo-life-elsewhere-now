// 程序化合成音效引擎 —— 无音频文件、完全离线、尊重浏览器自动播放策略。
// 所有音效都由用户手势链触发（翻页/点击/滑动）；AudioContext 首次调用时惰性创建。
// 合成失败时静默降级：音效永远不允许影响主体验。

const STORAGE_KEY = 'life-elsewhere-sound-v1';

let ctx: AudioContext | null = null;
let ambientGain: GainNode | null = null;
let muted = (() => {
  try { return globalThis.localStorage?.getItem(STORAGE_KEY) === 'off'; } catch { return false; }
})();

export function isMuted(): boolean { return muted; }

export function setMuted(value: boolean): void {
  muted = value;
  if (ambientGain) ambientGain.gain.value = value ? 0 : 0.014;
  try { globalThis.localStorage?.setItem(STORAGE_KEY, value ? 'off' : 'on'); } catch { /* storage unavailable */ }
}

function audio(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) {
      ctx = new Ctor();
      ambientGain = ctx.createGain();
      ambientGain.gain.value = muted ? 0 : 0.014;
      ambientGain.connect(ctx.destination);
      [65.41, 98].forEach((frequency, index) => {
        const oscillator = ctx!.createOscillator();
        oscillator.type = index ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        oscillator.connect(ambientGain!);
        oscillator.start();
      });
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

// 短包络主音：triangle 为主音色（编辑部克制感），sine 用于更轻的场景。
function tone(context: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'triangle', peak = 0.09): void {
  try {
    const osc = context.createOscillator();
    const gain = context.createGain();
    const t0 = context.currentTime + start;
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(context.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch { /* never crash on sound */ }
}

// 纸感噪声：短促宽带爆裂，衰减包络，用于翻页与揭晓。
function paper(context: AudioContext, start: number, dur = 0.06, peak = 0.05): void {
  try {
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * dur)), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = context.createBufferSource();
    const gain = context.createGain();
    const t0 = context.currentTime + start;
    src.buffer = buffer;
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(gain).connect(context.destination);
    src.start(t0);
  } catch { /* never crash on sound */ }
}

export type SfxName = 'tick'|'collect'|'win'|'lose'|'reveal'|'complete'|'journey'|'begin'|'save';

// 音序:频率表(Hz)。全部采用大调上行/下行的克制和弦,与纸面视觉同调。
const SEQUENCES: Record<Exclude<SfxName, 'tick'|'reveal'|'save'>, number[]> = {
  collect: [329.63, 392.0, 523.25],                    // E4 G4 C5 —— 集邮点亮
  win: [523.25, 659.25, 783.99, 1046.5],               // C5 E5 G5 C6 —— 对决猜对
  lose: [392.0, 329.63],                               // G4 E4 —— 对决猜错(下行,低沉)
  complete: [523.25, 659.25, 783.99, 1046.5, 1318.51], // C5 E5 G5 C6 E6 —— 集齐 10 区域
  journey: [261.63, 329.63, 392.0, 523.25],            // C4 E4 G4 C5 —— 旅程收束(慢,sine)
  begin: [220.0, 329.63, 440.0],                       // A3 E4 A4 —— 新旅程开始
};

export function play(name: SfxName): void {
  if (muted) return;
  try {
    const context = audio();
    if (!context) return;
    if (name === 'tick') { paper(context, 0, 0.05, 0.04); return; }
    if (name === 'reveal') { tone(context, 587.33, 0, 0.22, 'sine', 0.1); paper(context, 0.01, 0.08, 0.03); return; }
    if (name === 'save') { tone(context, 659.25, 0, 0.14, 'triangle', 0.08); tone(context, 880.0, 0.07, 0.18, 'triangle', 0.08); return; }
    const seq = SEQUENCES[name];
    if (!seq) return;
    const slow = name === 'journey';
    const step = slow ? 0.16 : 0.085;
    seq.forEach((freq, index) => tone(context, freq, index * step, slow ? 0.34 : 0.22, slow ? 'sine' : 'triangle', name === 'lose' ? 0.07 : 0.09));
    if (name === 'complete' || name === 'journey') paper(context, seq.length * step + 0.05, 0.12, 0.05);
  } catch { /* never crash on sound */ }
}
