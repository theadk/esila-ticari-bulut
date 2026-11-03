import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import zlib from 'zlib';

// Allowed database tables whitelist
export const ALLOWED_TABLES = new Set([
  'users',
  'settings',
  'categories',
  'brands',
  'products',
  'warehouses',
  'stock_transfers',
  'customers',
  'customer_transactions',
  'cash_transactions',
  'bank_accounts',
  'boms',
  'work_orders',
  'personnel',
  'personnel_records',
  'payroll_approvals',
  'orders',
  'proposals',
  'reconciliations',
  'service_tickets',
  'e_invoices',
  'email_logs',
  'reminder_notes',
  'job_applications',
  'purchase_requests',
  'cheque_notes',
  'notifications',
  'campaigns',
  'meeting_notes',
  'attendance',
  'salary_adjustments',
  'personnel_tasks',
  'documents',
  'waybills',
  'suspended_carts',
  'personnel_kpis',
  'tenants',
  'session_logs',
  'payments'
]);

const VALID_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/;
const VALID_EMAIL_REGEX = /^[^\s@<>'"`;\\]+@[^\s@<>'"`;\\]+\.[^\s@<>'"`;\\]{2,}$/;
const VALID_PHONE_REGEX = /^[0-9+\s()-]{7,25}$/;
const VALID_VKN_REGEX = /^[0-9a-zA-Z_-]{1,32}$/;

export function isValidSqlIdentifier(identifier: string): boolean {
  return typeof identifier === 'string' && VALID_IDENTIFIER_REGEX.test(identifier);
}

export function sanitizeSqlIdentifier(identifier: string): string {
  if (!isValidSqlIdentifier(identifier)) {
    throw new Error(`Güvenlik İhlali: Geçersiz SQL tanımlayıcısı reddedildi (${identifier})`);
  }
  return identifier;
}

export function sanitizeTenantId(rawVkn: unknown): string {
  if (typeof rawVkn !== 'string' || !rawVkn.trim()) {
    return '1111111111';
  }
  const cleaned = rawVkn.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned.slice(0, 32) || '1111111111';
}

export function sanitizeRecordId(rawId: unknown): string {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    return String(rawId);
  }
  if (typeof rawId !== 'string') return '';
  return rawId.trim().replace(/[\x00-\x1F\x7F<>'"`;\\]/g, '').slice(0, 128);
}

export function sanitizeFilename(rawName: unknown): string {
  if (typeof rawName !== 'string') return '';
  return rawName.replace(/[^a-zA-Z0-9_.-]/g, '').replace(/\.\.+/g, '');
}

export function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && email.length <= 254 && VALID_EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone: unknown): boolean {
  return typeof phone === 'string' && VALID_PHONE_REGEX.test(phone.trim());
}

export function isValidVkn(vkn: unknown): boolean {
  return typeof vkn === 'string' && VALID_VKN_REGEX.test(vkn.trim());
}

// HTML Entity Escaper to prevent XSS in server-generated emails and HTML responses
export function escapeHtml(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// XML / SOAP Entity Escaper to prevent XML/SOAP/XXE Injection
export function escapeXml(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\]\]>/g, ']]&gt;');
}

// Safe HTML Sanitizer for rich email content (strips scripts, iframes, event handlers, javascript: URIs)
export function sanitizeRichHtml(html: unknown): string {
  if (typeof html !== 'string') return '';
  return html
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*script\b[^>]*\/?>/gi, '')
    .replace(/<\s*(?:iframe|object|embed|applet|meta|base|form|link)\b[^>]*>[\s\S]*?<\s*\/\s*(?:iframe|object|embed|applet|meta|base|form|link)\s*>/gi, '')
    .replace(/<\s*(?:iframe|object|embed|applet|meta|base|form|link)\b[^>]*\/?>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, 'blocked:');
}

// Plain-text / field XSS Sanitizer
export function sanitizePlainText(input: string, maxLength = 10000): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*\/?\s*(?:script|iframe|object|embed|applet|meta|base|svg|math|link|style)\b[^>]*>/gi, '')
    .replace(/\bon[a-z]{2,30}\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    .slice(0, maxLength);
}

// High-confidence SQL Injection patterns
const SQLI_PATTERNS: RegExp[] = [
  /\bUNION\s+(?:ALL\s+)?SELECT\b/i,
  /\bSELECT\b[\s\S]{1,160}\bFROM\s+(?:INFORMATION_SCHEMA|MYSQL\.|SYS\.|PG_CATALOG)/i,
  /\b(?:SLEEP|BENCHMARK|PG_SLEEP|LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\s*\(/i,
  /(?:^|['"\s)\]])(?:OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /['"]\s*(?:OR|AND)\s+['"][a-zA-Z0-9_]+['"]\s*=\s*['"][a-zA-Z0-9_]+/i,
  /['"]\s*(?:OR|AND)\s+(?:TRUE|1=1)\s*(?:--|\#|\/\*)/i,
  /;\s*(?:DROP|TRUNCATE|ALTER|DELETE\s+FROM|UPDATE\s+\w+\s+SET|INSERT\s+INTO|EXEC|EXECUTE|GRANT|REVOKE)\b/i,
  /\bWAITFOR\s+DELAY\b/i,
  /\b(?:EXTRACTVALUE|UPDATEXML|DBMS_PIPE\.RECEIVE_MESSAGE)\s*\(/i,
  /\b0x(?:27|3c736372697074|554e494f4e)\b/i,
  /\x00/
];

// High-confidence Cross-Site Scripting (XSS) patterns
const XSS_PATTERNS: RegExp[] = [
  /<\s*script\b[^>]*>/i,
  /<\s*\/\s*script\s*>/i,
  /(?:javascript|vbscript)\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon(?:error|load|click|mouseover|mouseenter|focus|blur|submit|change|keyup|keydown|animationstart|toggle)\s*=\s*['"`]?[^'"`>\s]+/i,
  /<\s*(?:iframe|object|embed|applet|base)\b[^>]*>/i,
  /<\s*svg\b[^>]*\bon[a-z]+\s*=/i,
  /<\s*img\b[^>]*\bonerror\s*=/i,
  /\b(?:document\.cookie|document\.write|window\.location\s*=|eval\s*\(|Function\s*\()/i
];

// Fields that legitimately contain base64 images, XML invoices, or rich HTML email templates
const BINARY_OR_XML_KEYS = new Set([
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

function containsSqlInjection(value: unknown, keyName: string = ''): boolean {
  if (typeof value === 'string') {
    if (BINARY_OR_XML_KEYS.has(keyName) || RICH_HTML_KEYS.has(keyName)) {
      return /\bFROM\s+INFORMATION_SCHEMA\b/i.test(value) || /\bINTO\s+(?:OUTFILE|DUMPFILE)\b/i.test(value);
    }
    if (value.length > 20000) return false;
    for (const pattern of SQLI_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsSqlInjection(item, keyName));
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
        return true;
      }
      if (SQLI_PATTERNS.some((p) => p.test(k))) {
        return true;
      }
      if (containsSqlInjection(v, k)) {
        return true;
      }
    }
  }
  return false;
}

function containsXssPayload(value: unknown, keyName: string = ''): boolean {
  if (typeof value === 'string') {
    if (BINARY_OR_XML_KEYS.has(keyName)) {
      // Allow base64 image data URIs (data:image/...) but block data:text/html or <script>
      return /<\s*script\b/i.test(value) || /data\s*:\s*text\/html/i.test(value);
    }
    if (RICH_HTML_KEYS.has(keyName)) {
      // Rich HTML is sanitized via sanitizeRichHtml, only block explicit <script> or onerror/onload attacks
      return /<\s*script\b/i.test(value) || /\bon(?:error|load)\s*=/i.test(value);
    }
    if (value.length > 20000) return false;
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsXssPayload(item, keyName));
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (XSS_PATTERNS.some((p) => p.test(k))) {
        return true;
      }
      if (containsXssPayload(v, k)) {
        return true;
      }
    }
  }
  return false;
}

// Recursively sanitize all string inputs in an object/array in-place
export function sanitizePayloadDeep<T>(value: T, keyName: string = ''): T {
  if (typeof value === 'string') {
    if (BINARY_OR_XML_KEYS.has(keyName)) {
      return value.replace(/\x00/g, '') as unknown as T;
    }
    if (RICH_HTML_KEYS.has(keyName)) {
      return sanitizeRichHtml(value) as unknown as T;
    }
    const cleaned = sanitizePlainText(value);
    if (cleaned !== value) {
      securityStats.sanitizedInputsCount++;
    }
    return cleaned as unknown as T;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = sanitizePayloadDeep(value[i], keyName);
    }
    return value;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const k of Object.keys(record)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
        delete record[k];
        continue;
      }
      record[k] = sanitizePayloadDeep(record[k], k);
    }
    return value;
  }
  return value;
}

// Security metrics & blocked attempts log
interface SecurityStats {
  blockedSqlInjectionCount: number;
  blockedXssCount: number;
  sanitizedInputsCount: number;
  blockedScannerCount: number;
  blockedPathTraversalCount: number;
  lastBlockedAt: string | null;
  lastBlockedReason: string | null;
}

const securityStats: SecurityStats = {
  blockedSqlInjectionCount: 0,
  blockedXssCount: 0,
  sanitizedInputsCount: 0,
  blockedScannerCount: 0,
  blockedPathTraversalCount: 0,
  lastBlockedAt: null,
  lastBlockedReason: null
};

// Background traffic optimization metrics
interface TrafficOptimizationStats {
  compressedResponsesCount: number;
  notModified304Count: number;
  batchedBootstrapCount: number;
  cachedExchangeRateHits: number;
  savedBytesTotal: number;
}

const trafficStats: TrafficOptimizationStats = {
  compressedResponsesCount: 0,
  notModified304Count: 0,
  batchedBootstrapCount: 0,
  cachedExchangeRateHits: 0,
  savedBytesTotal: 0
};

export function recordBootstrapBatch(savedRequestsCount = 30) {
  trafficStats.batchedBootstrapCount++;
  trafficStats.savedBytesTotal += savedRequestsCount * 600;
}

export function recordExchangeRateCacheHit(bytesSaved = 18500) {
  trafficStats.cachedExchangeRateHits++;
  trafficStats.savedBytesTotal += bytesSaved;
}

export function getTrafficStats() {
  return { ...trafficStats };
}

export function getSecurityStats() {
  return {
    ...securityStats,
    protections: {
      sqlInjectionWaf: true,
      xssSanitizerActive: true,
      inputValidationActive: true,
      parameterizedQueries: true,
      identifierWhitelisting: true,
      multipleStatementsDisabled: true,
      antiReverseEngineeringHeaders: true,
      sourceMapProtection: true,
      sensitiveFileBlocking: true,
      scannerBotProtection: true
    }
  };
}

// Rate limiter per IP for API endpoints
const ipRequestMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 600;

// Known SQLi / Reverse Engineering scanner User-Agents
const BLOCKED_USER_AGENTS = /(?:sqlmap|havij|acunetix|nikto|nmap|nessus|dirbuster|gobuster|wfuzz|nuclei|zgrab|masscan)/i;

// Sensitive files that must never be served to clients (anti-reverse engineering)
const BLOCKED_PATH_PATTERNS = [
  /^\/\.env/i,
  /^\/\.git/i,
  /\/local_db\.json$/i,
  /\/backup\.json$/i,
  /^\/backups\//i,
  /\/server\.ts$/i,
  /\/server\//i,
  /\/esila_ticari_schema\.sql$/i,
  /\/package-lock\.json$/i,
  /\/tsconfig\.json$/i,
  /\.map$/i
];

export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Hide server fingerprint headers & set anti-XSS / anti-reverse-engineering security headers
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  const reqPath = req.path || req.url || '';

  // 2. Block direct access to source code, database files, .env, and source maps (.map)
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(reqPath)) {
      securityStats.blockedPathTraversalCount++;
      securityStats.lastBlockedAt = new Date().toISOString();
      securityStats.lastBlockedReason = `Hassas dosya/kaynak kod erişimi engellendi (${reqPath})`;
      return res.status(403).json({
        error: 'Erişim Reddedildi: Güvenlik politikası gereği bu kaynağa erişilemez.'
      });
    }
  }

  // 3. Block automated SQL injection & vulnerability scanners
  const userAgent = String(req.headers['user-agent'] || '');
  if (BLOCKED_USER_AGENTS.test(userAgent)) {
    securityStats.blockedScannerCount++;
    securityStats.lastBlockedAt = new Date().toISOString();
    securityStats.lastBlockedReason = `Güvenlik tarayıcı bot engellendi (${userAgent.slice(0, 50)})`;
    return res.status(403).json({
      error: 'Erişim Reddedildi.'
    });
  }

  // 4. API Rate Limiting + ETag 304 & Gzip Compression for /api/* responses
  if (reqPath.startsWith('/api/')) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    const now = Date.now();
    const record = ipRequestMap.get(clientIp);
    if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
      ipRequestMap.set(clientIp, { count: 1, windowStart: now });
    } else {
      record.count++;
      if (record.count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
          error: 'Çok fazla istek gönderildi. Lütfen kısa bir süre bekleyip tekrar deneyiniz.'
        });
      }
    }

    // Intercept res.json to apply ETag 304 Not Modified and Gzip compression
    const originalJson = res.json.bind(res);
    res.json = function (body: any): Response {
      try {
        const jsonString = JSON.stringify(body);
        const rawBuffer = Buffer.from(jsonString, 'utf-8');
        const originalByteLength = rawBuffer.byteLength;

        if (req.method === 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
          const hash = crypto.createHash('sha1').update(rawBuffer).digest('hex').slice(0, 20);
          const etag = `W/"${hash}"`;
          res.setHeader('ETag', etag);
          res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

          const ifNoneMatch = req.headers['if-none-match'];
          if (ifNoneMatch && ifNoneMatch === etag) {
            trafficStats.notModified304Count++;
            trafficStats.savedBytesTotal += originalByteLength;
            res.status(304);
            return res.end();
          }
        }

        const acceptEncoding = String(req.headers['accept-encoding'] || '');
        if (originalByteLength >= 1024 && acceptEncoding.includes('gzip') && !res.getHeader('Content-Encoding')) {
          const compressed = zlib.gzipSync(rawBuffer, { level: zlib.constants.Z_BEST_SPEED });
          if (compressed.byteLength < originalByteLength) {
            trafficStats.compressedResponsesCount++;
            trafficStats.savedBytesTotal += originalByteLength - compressed.byteLength;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Vary', 'Accept-Encoding');
            res.setHeader('Content-Length', String(compressed.byteLength));
            return res.send(compressed);
          }
        }
      } catch (_err) {
        // Fallback to standard res.json on any serialization error
      }
      return originalJson(body);
    };
  }

  // 5. Sanitize x-tenant-id and x-user-id headers against SQLi, XSS, and Path Traversal
  if (req.headers['x-tenant-id']) {
    const rawTenant = String(req.headers['x-tenant-id']);
    if (
      containsSqlInjection(rawTenant) ||
      containsXssPayload(rawTenant) ||
      rawTenant.includes('..') ||
      rawTenant.includes('/') ||
      rawTenant.includes('\\')
    ) {
      securityStats.blockedSqlInjectionCount++;
      securityStats.lastBlockedAt = new Date().toISOString();
      securityStats.lastBlockedReason = 'Geçersiz x-tenant-id başlığı engellendi';
      return res.status(400).json({ error: 'Güvenlik İhlali: Geçersiz kiracı kimliği.' });
    }
    req.headers['x-tenant-id'] = sanitizeTenantId(rawTenant);
  }

  if (req.headers['x-user-id']) {
    req.headers['x-user-id'] = sanitizeRecordId(req.headers['x-user-id']);
  }

  // 6. Inspect URL query, route params, and request body for SQL Injection payloads
  if (
    containsSqlInjection(req.query) ||
    containsSqlInjection(req.params) ||
    (req.body && typeof req.body === 'object' && containsSqlInjection(req.body))
  ) {
    securityStats.blockedSqlInjectionCount++;
    securityStats.lastBlockedAt = new Date().toISOString();
    securityStats.lastBlockedReason = `SQL Injection girişimi engellendi (${req.method} ${reqPath})`;
    console.warn(`[WAF] SQL Injection girişimi engellendi: ${req.method} ${reqPath}`);
    return res.status(400).json({
      error: 'Güvenlik Duvarı (WAF): Zararlı SQL ifadeleri tespit edildi ve işlem engellendi.'
    });
  }

  // 7. Inspect URL query, route params, and request body for XSS payloads
  if (
    containsXssPayload(req.query) ||
    containsXssPayload(req.params) ||
    (req.body && typeof req.body === 'object' && containsXssPayload(req.body))
  ) {
    securityStats.blockedXssCount++;
    securityStats.lastBlockedAt = new Date().toISOString();
    securityStats.lastBlockedReason = `XSS (Cross-Site Scripting) girişimi engellendi (${req.method} ${reqPath})`;
    console.warn(`[WAF] XSS girişimi engellendi: ${req.method} ${reqPath}`);
    return res.status(400).json({
      error: 'Güvenlik Duvarı (WAF): Zararlı betik (XSS) ifadeleri tespit edildi ve işlem engellendi.'
    });
  }

  // 8. Deep recursive sanitization of all incoming parameters, queries, and request body fields
  if (req.query && typeof req.query === 'object') {
    sanitizePayloadDeep(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizePayloadDeep(req.params);
  }
  if (req.body && typeof req.body === 'object') {
    sanitizePayloadDeep(req.body);
  }

  next();
}


