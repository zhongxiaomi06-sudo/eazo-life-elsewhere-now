/**
 * Eazo preview inspector — creator review tool.
 *
 * 激活方式: URL 带 `?inspector=1`。默认完全关闭,不改变产品功能或界面。
 * 激活后: 点选页面任意元素 → 高亮 + 元素信息 + 按 selector 存评论(localStorage)。
 * 所有审查 UI 位于独立 shadow DOM 内,与产品样式完全隔离。
 */

export interface PreviewComment {
  id: string;
  selector: string;
  label: string;
  text: string;
  createdAt: number;
}

export interface CommentStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const STORAGE_KEY = 'eazo-preview-comments-v1';

let enabled = false;

export function isInspectorEnabled(search: string = globalThis.location?.search ?? ''): boolean {
  try {
    return new URLSearchParams(search).get('inspector') === '1';
  } catch {
    return search.includes('inspector=1');
  }
}

export function loadComments(store?: CommentStore): PreviewComment[] {
  const s = store ?? (globalThis as { localStorage?: CommentStore }).localStorage;
  try {
    const raw = s?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PreviewComment[]) : [];
  } catch {
    return [];
  }
}

function saveAll(comments: PreviewComment[], store?: CommentStore): void {
  const s = store ?? (globalThis as { localStorage?: CommentStore }).localStorage;
  try {
    s?.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch {
    /* 隐私模式 / 配额不足时静默降级 */
  }
}

export function commentsFor(selector: string, store?: CommentStore): PreviewComment[] {
  return loadComments(store).filter((comment) => comment.selector === selector);
}

export function addComment(selector: string, label: string, text: string, store?: CommentStore): PreviewComment {
  const comment: PreviewComment = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    selector,
    label,
    text,
    createdAt: Date.now(),
  };
  saveAll([...loadComments(store), comment], store);
  return comment;
}

export function removeComment(id: string, store?: CommentStore): PreviewComment[] {
  const next = loadComments(store).filter((comment) => comment.id !== id);
  saveAll(next, store);
  return next;
}

export function exportComments(store?: CommentStore): string {
  return JSON.stringify(loadComments(store), null, 2);
}

/** CSS 选择器转义(不依赖 CSS.escape,兼容 jsdom)。 */
export function escapeSel(part: string): string {
  return part.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

/** 生成指向元素的稳定 CSS 路径: 优先 id,其次类名,必要时 nth-of-type。 */
export function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node !== document.documentElement && node !== document.body) {
    const element: Element = node;
    let part = element.tagName.toLowerCase();
    if (element.id) {
      parts.unshift(`#${escapeSel(element.id)}`);
      break;
    }
    const classes = Array.from(element.classList)
      .slice(0, 3)
      .map((c) => `.${escapeSel(c)}`)
      .join('');
    if (classes) part += classes;
    const parent: Element | null = element.parentElement;
    if (parent) {
      const same = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(element) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(' > ');
}

function elementLabel(el: Element): string {
  const id = el.id ? `#${escapeSel(el.id)}` : '';
  const classes = Array.from(el.classList)
    .slice(0, 3)
    .map((c) => `.${escapeSel(c)}`)
    .join('');
  return `${el.tagName.toLowerCase()}${id}${classes || ''}`;
}

function elementText(el: Element): string {
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

const CSS = `
:host{all:initial}
*{box-sizing:border-box;margin:0;padding:0}
.overlay{position:fixed;inset:0;z-index:2147483645;pointer-events:none}
.hl{position:absolute;top:0;left:0;outline:2px solid #ff5c39;outline-offset:-2px;background:rgba(255,92,57,.10);box-shadow:0 0 0 4px rgba(255,92,57,.25);pointer-events:none}
.hl::after{content:"";position:absolute;left:0;right:0;bottom:-20px;height:20px;background:linear-gradient(180deg,rgba(255,92,57,.18),transparent)}
.bar{position:fixed;right:14px;bottom:calc(74px + env(safe-area-inset-bottom,0px));z-index:2147483646;display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #33363f;border-radius:999px;background:#16181d;color:#e8e6e1;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35);pointer-events:auto;user-select:none}
.bar .dot{width:8px;height:8px;border-radius:50%;background:#ff5c39;box-shadow:0 0 0 3px rgba(255,92,57,.25)}
.bar .count{min-width:18px;text-align:center;padding:2px 6px;border-radius:999px;background:#2a2d36;color:#c9c6bf;font-size:11px}
.bar button{border:0;border-radius:999px;background:#2a2d36;color:#e8e6e1;padding:5px 10px;font:inherit;cursor:pointer}
.bar button:hover{background:#3a3e4a}
.bar button.quit{background:#3a2020;color:#ff9d8a}
.bubble{position:fixed;z-index:2147483646;width:300px;max-height:min(420px,72vh);display:flex;flex-direction:column;border:1px solid #33363f;border-radius:14px;background:#16181d;color:#e8e6e1;font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;box-shadow:0 16px 48px rgba(0,0,0,.45);pointer-events:auto;overflow:hidden}
.b-head{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid #262931}
.b-head code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 11px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#ff9d8a}
.b-head button{border:0;background:none;color:#8b8e98;cursor:pointer;font-size:13px;line-height:1;padding:2px 4px}
.b-head button:hover{color:#fff}
.b-meta{display:grid;grid-template-columns:1fr 1fr;gap:1px;padding:8px 12px;background:#1b1e24;border-bottom:1px solid #262931}
.b-meta div{display:grid;gap:1px}
.b-meta span{color:#6f727c;font-size:9px;text-transform:uppercase;letter-spacing:.08em}
.b-meta strong{font-size:11px;font-weight:600;color:#d5d2ca;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-text{padding:8px 12px;color:#a9a6a0;font-size:11px;border-bottom:1px solid #262931;max-height:56px;overflow:hidden}
.b-text:empty{display:none}
.b-comments{flex:1;overflow-y:auto;padding:8px 12px;display:grid;gap:8px;min-height:0}
.b-empty{color:#6f727c;font-size:11px;text-align:center;padding:14px 0 6px}
.b-item{border:1px solid #2c2f38;border-radius:10px;background:#1b1e24;padding:8px 10px}
.b-item .who{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px}
.b-item time{color:#6f727c;font-size:9px;text-transform:uppercase;letter-spacing:.05em}
.b-item button{border:0;background:none;color:#8b8e98;cursor:pointer;font-size:12px;line-height:1;padding:1px 4px}
.b-item button:hover{color:#ff9d8a}
.b-item p{color:#d5d2ca;font-size:12px;white-space:pre-wrap;word-break:break-word}
.b-write{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #262931;background:#1b1e24}
.b-write textarea{flex:1;resize:none;height:44px;border:1px solid #33363f;border-radius:8px;background:#121419;color:#e8e6e1;padding:8px 10px;font:inherit;font-size:12px;outline:none}
.b-write textarea:focus{border-color:#ff5c39}
.b-write button{border:0;border-radius:8px;background:#ff5c39;color:#fff;padding:0 14px;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.b-write button:hover{background:#ff6f50}
.b-status{padding:4px 12px 8px;color:#7fd08c;font-size:10px;min-height:0}
`;

export function initPreviewInspector(): void {
  if (enabled || typeof document === 'undefined') return;
  if (!isInspectorEnabled()) return;
  enabled = true;

  const host = document.createElement('div');
  host.id = 'eazo-preview-inspector-host';
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483645;pointer-events:none;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${CSS}</style><div class="overlay"><div class="hl" hidden></div></div>
    <div class="bar"><span class="dot"></span><span>Review</span><span class="count">0</span><button data-act="export">Export</button><button class="quit" data-act="quit">Exit</button></div>
    <div class="bubble" hidden>
      <div class="b-head"><code data-role="label"></code><button data-act="copy" title="Copy selector">⧉</button><button data-act="close" title="Close">×</button></div>
      <div class="b-meta"><div><span>Tag</span><strong data-role="tag"></strong></div><div><span>Size</span><strong data-role="size"></strong></div></div>
      <div class="b-text" data-role="text"></div>
      <div class="b-comments" data-role="comments"></div>
      <div class="b-write"><textarea data-role="write" placeholder="Comment on this element…"></textarea><button data-act="add">Add</button></div>
      <div class="b-status" data-role="status"></div>
    </div>`;

  const hl = root.querySelector('.hl') as HTMLDivElement;
  const bubble = root.querySelector('.bubble') as HTMLDivElement;
  const bar = root.querySelector('.bar') as HTMLDivElement;
  const countEl = root.querySelector('.count') as HTMLSpanElement;
  const labelEl = root.querySelector('[data-role="label"]') as HTMLElement;
  const tagEl = root.querySelector('[data-role="tag"]') as HTMLElement;
  const sizeEl = root.querySelector('[data-role="size"]') as HTMLElement;
  const textEl = root.querySelector('[data-role="text"]') as HTMLElement;
  const commentsEl = root.querySelector('[data-role="comments"]') as HTMLElement;
  const writeEl = root.querySelector('[data-role="write"]') as HTMLTextAreaElement;
  const statusEl = root.querySelector('[data-role="status"]') as HTMLElement;

  let current: Element | null = null;
  let currentSelector = '';
  let statusTimer: ReturnType<typeof setTimeout> | undefined;

  const allComments = () => loadComments();

  const refreshCount = () => {
    countEl.textContent = String(allComments().length);
  };

  const status = (message: string) => {
    statusEl.textContent = message;
    if (statusTimer !== undefined) globalThis.clearTimeout(statusTimer);
    statusTimer = globalThis.setTimeout(() => {
      statusEl.textContent = '';
    }, 2000);
  };

  const renderComments = () => {
    const comments = commentsFor(currentSelector);
    commentsEl.innerHTML = '';
    if (comments.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'b-empty';
      empty.textContent = 'No comments yet — add the first one below.';
      commentsEl.appendChild(empty);
      return;
    }
    for (const comment of comments) {
      const item = document.createElement('div');
      item.className = 'b-item';
      const who = document.createElement('div');
      who.className = 'who';
      const time = document.createElement('time');
      time.textContent = new Date(comment.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const remove = document.createElement('button');
      remove.textContent = '✕';
      remove.setAttribute('aria-label', 'Delete comment');
      remove.addEventListener('click', () => {
        removeComment(comment.id);
        renderComments();
        refreshCount();
      });
      who.append(time, remove);
      const body = document.createElement('p');
      body.textContent = comment.text;
      item.append(who, body);
      commentsEl.appendChild(item);
    }
  };

  const position = () => {
    if (!current) return;
    const rect = current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    hl.hidden = false;
    hl.style.transform = `translate(${rect.left}px,${rect.top}px)`;
    hl.style.width = `${rect.width}px`;
    hl.style.height = `${rect.height}px`;
    const bw = 300;
    let left = rect.left;
    if (left + bw > vw - 12) left = Math.max(12, vw - bw - 12);
    const bh = Math.min(420, vh * 0.72);
    let top = rect.bottom + 12;
    if (top + bh > vh - 12) top = Math.max(12, rect.top - bh - 12);
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
  };

  const select = (el: Element) => {
    current = el;
    currentSelector = cssPath(el);
    labelEl.textContent = elementLabel(el);
    tagEl.textContent = el.tagName.toLowerCase();
    const rect = el.getBoundingClientRect();
    sizeEl.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    textEl.textContent = elementText(el);
    bubble.hidden = false;
    renderComments();
    position();
  };

  const onDocClick = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (!target || host.contains(target)) return;
    event.preventDefault();
    event.stopPropagation();
    if (target instanceof Element) select(target);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') bubble.hidden = true;
  };

  const onScrollOrResize = () => position();

  const submitComment = () => {
    const text = writeEl.value.trim();
    if (!text || !currentSelector) return;
    addComment(currentSelector, labelEl.textContent ?? currentSelector, text);
    writeEl.value = '';
    renderComments();
    refreshCount();
    status('✓ Saved on this device');
  };

  bar.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;
    const act = button.dataset.act;
    if (act === 'export') {
      const payload = exportComments();
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `eazo-preview-comments-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      void globalThis.navigator?.clipboard?.writeText(payload).catch(() => undefined);
      status('✓ Exported as JSON (also copied)');
    } else if (act === 'quit') {
      quit();
    }
  });

  bubble.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;
    const act = button.dataset.act;
    if (act === 'close') bubble.hidden = true;
    else if (act === 'copy') {
      void globalThis.navigator?.clipboard?.writeText(currentSelector).then(() => status('✓ Selector copied'));
    } else if (act === 'add') submitComment();
  });

  writeEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitComment();
    }
  });

  const quit = () => {
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
    host.remove();
    enabled = false;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('inspector');
      window.history.replaceState(null, '', url.toString());
    } catch {
      /* 忽略 */
    }
  };

  document.addEventListener('click', onDocClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize);
  document.documentElement.appendChild(host);
  refreshCount();
  console.info('[preview-inspector] enabled — click any element to inspect and comment.');
}
