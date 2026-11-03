// Client-side Anti-Reverse Engineering, XSS Sanitizer & SQLi Input Validation Guard
import toast from 'react-hot-toast';

let initialized = false;

const CLIENT_SQLI_PATTERNS: RegExp[] = [
  /\bUNION\s+(?:ALL\s+)?SELECT\b/i,
  /\bSELECT\b[\s\S]{1,120}\bFROM\s+(?:INFORMATION_SCHEMA|MYSQL\.|SYS\.)/i,
  /\b(?:SLEEP|BENCHMARK|PG_SLEEP|LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\s*\(/i,
  /(?:^|['"\s)\]])(?:OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /['"]\s*(?:OR|AND)\s+['"][a-zA-Z0-9_]+['"]\s*=\s*['"][a-zA-Z0-9_]+/i,
  /;\s*(?:DROP|TRUNCATE|ALTER|DELETE\s+FROM|UPDATE\s+\w+\s+SET|INSERT\s+INTO|EXEC|EXECUTE)\b/i,
  /\bWAITFOR\s+DELAY\b/i,
  /\b(?:EXTRACTVALUE|UPDATEXML)\s*\(/i
];

const CLIENT_XSS_PATTERNS: RegExp[] = [
  /<\s*script\b[^>]*>/i,
  /<\s*\/\s*script\s*>/i,
  /(?:javascript|vbscript)\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon(?:error|load|click|mouseover|mouseenter|focus|blur|submit|animationstart|toggle)\s*=\s*['"`]?[^'"`>\s]+/i,
  /<\s*(?:iframe|object|embed|applet|base)\b[^>]*>/i,
  /<\s*svg\b[^>]*\bon[a-z]+\s*=/i,
  /<\s*img\b[^>]*\bonerror\s*=/i
];

const EXEMPT_BINARY_KEYS = new Set([
  'imageBase64',
  'xmlContent',
  'fileData',
  'companyLogo',
  'invoiceTemplate_stamp',
  'image'
]);

const RICH_HTML_KEYS = new Set([
  'html',
  'content'
]);

export function sanitizeClientText(input: string, maxLength = 10000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*\/?\s*(?:script|iframe|object|embed|applet|meta|base|svg|math|link|style)\b[^>]*>/gi, '')
    .replace(/\bon[a-z]{2,30}\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    .slice(0, maxLength);
}

export function sanitizeClientRichHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return html
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*(?:iframe|object|embed|applet|meta|base|form|link)\b[^>]*>[\s\S]*?<\s*\/\s*(?:iframe|object|embed|applet|meta|base|form|link)\s*>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, 'blocked:');
}

export function containsClientAttackPayload(value: unknown, keyName = ''): { malicious: boolean; type?: 'SQLi' | 'XSS' } {
  if (typeof value === 'string') {
    if (EXEMPT_BINARY_KEYS.has(keyName)) {
      if (/<\s*script\b/i.test(value) || /data\s*:\s*text\/html/i.test(value)) {
        return { malicious: true, type: 'XSS' };
      }
      return { malicious: false };
    }
    if (!RICH_HTML_KEYS.has(keyName)) {
      for (const p of CLIENT_XSS_PATTERNS) {
        if (p.test(value)) return { malicious: true, type: 'XSS' };
      }
    }
    for (const p of CLIENT_SQLI_PATTERNS) {
      if (p.test(value)) return { malicious: true, type: 'SQLi' };
    }
    return { malicious: false };
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const res = containsClientAttackPayload(item, keyName);
      if (res.malicious) return res;
    }
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const res = containsClientAttackPayload(v, k);
      if (res.malicious) return res;
    }
  }
  return { malicious: false };
}

export function sanitizeClientPayload<T>(value: T, keyName = ''): T {
  if (typeof value === 'string') {
    if (EXEMPT_BINARY_KEYS.has(keyName)) {
      return value.replace(/\x00/g, '') as unknown as T;
    }
    if (RICH_HTML_KEYS.has(keyName)) {
      return sanitizeClientRichHtml(value) as unknown as T;
    }
    return sanitizeClientText(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeClientPayload(item, keyName)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      out[k] = sanitizeClientPayload(v, k);
    }
    return out as T;
  }
  return value;
}

export function initClientSecurityGuard() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // 1. Disable React DevTools global hook properties to prevent component state reverse engineering
  try {
    const devToolsHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (devToolsHook && typeof devToolsHook === 'object') {
      for (const key of Object.keys(devToolsHook)) {
        if (typeof devToolsHook[key] === 'function') {
          devToolsHook[key] = () => {};
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. Block DevTools & View-Source keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      const key = e.key?.toUpperCase();
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      if (isCtrlOrMeta && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      if (isCtrlOrMeta && !e.shiftKey && (key === 'U' || key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true
  );

  // 3. Prevent right-click context menu on non-input UI elements to deter DOM/source inspection
  window.addEventListener(
    'contextmenu',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tagName = target.tagName?.toUpperCase();
      const isEditable =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        Boolean(target.closest('input, textarea, [contenteditable="true"]'));

      if (!isEditable) {
        e.preventDefault();
      }
    },
    false
  );

  // 4. Global DOM Input & Form Sanitizer + Validation Layer (blocks XSS & SQLi in any input/textarea/form)
  const inspectAndSanitizeElement = (el: HTMLInputElement | HTMLTextAreaElement): boolean => {
    if (!el || typeof el.value !== 'string' || !el.value) return false;
    if (el.type === 'file' || el.type === 'color' || el.type === 'range') return false;

    const check = containsClientAttackPayload(el.value);
    const sanitized = sanitizeClientText(el.value);

    if (check.malicious || sanitized !== el.value) {
      const cleaned = check.type === 'SQLi'
        ? sanitized.replace(/['";]|--|\b(?:UNION|SELECT|DROP|TRUNCATE|SLEEP|BENCHMARK)\b/gi, '')
        : sanitized;
      el.value = cleaned;
      toast.error(
        `Güvenlik Kalkanı: Giriş alanında zararlı ${check.type || 'XSS/SQL'} ifadesi tespit edildi ve temizlendi.`,
        { id: 'security-input-guard' }
      );
      return true;
    }
    return false;
  };

  window.addEventListener(
    'change',
    (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        inspectAndSanitizeElement(target as HTMLInputElement | HTMLTextAreaElement);
      }
    },
    true
  );

  window.addEventListener(
    'submit',
    (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form || typeof form.querySelectorAll !== 'function') return;
      const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      let blocked = false;
      inputs.forEach((input) => {
        if (inspectAndSanitizeElement(input)) {
          blocked = true;
        }
      });
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  // 5. Console security warning banner
  try {
    console.log(
      '%cDURUN! GÜVENLİK UYARISI',
      'color: #dc2626; font-size: 24px; font-weight: bold;'
    );
    console.log(
      '%cBu sistem Esila Ticari Güvenlik Kalkanı (WAF, XSS Sanitizer & Anti-Reverse Engineering) ile korunmaktadır. Kaynak kodların incelenmesi, kopyalanması veya SQL/XSS enjeksiyon girişimleri otomatik olarak kaydedilmekte ve engellenmektedir.',
      'color: #374151; font-size: 13px;'
    );
  } catch {
    // ignore
  }
}

