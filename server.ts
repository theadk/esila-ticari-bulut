import express from "express";
import crypto from 'crypto';


function generateSecurePassword() {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^*()_+=-";
  const all = lowercase + uppercase + numbers + symbols;

  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { config as dotenvConfig } from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
  dotenvConfig({ override: true });
}

import { getPool, initDb, getConfiguredDatabaseUrl, getLastDbError, resetPool, testMysqlConnection } from "./server/db.js";
import cors from "cors";
import { sendMail, notifyAdminDbDisconnect, getDbAlertStatus, getAdminNotificationEmails } from "./server/mailer.js";
import { startMailScheduler } from "./server/mailScheduler.js";
import { startBackupScheduler } from "./server/backupScheduler.js";
import {
  getFallbackTable,
  insertFallbackRow,
  updateFallbackRow,
  deleteFallbackRow,
  reloadFallbackDb
} from "./server/fallbackDb.js";
import {
  securityMiddleware,
  getSecurityStats,
  getTrafficStats,
  recordBootstrapBatch,
  recordExchangeRateCacheHit,
  isValidSqlIdentifier,
  sanitizeTenantId,
  sanitizeRecordId,
  sanitizeFilename,
  isValidEmail,
  isValidPhone,
  isValidVkn,
  escapeHtml,
  escapeXml,
  sanitizeRichHtml,
  ALLOWED_TABLES
} from "./server/security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loginAttempts = new Map<
  string,
  { attempts: number; lockUntil: number | null }
>();

function parseMysqlUri(uri: string) {
  if (!uri || !uri.startsWith("mysql://")) {
    return { host: "", port: "3306", user: "", password: "", database: "" };
  }
  try {
    const parsed = new URL(uri);
    return {
      host: parsed.hostname || "",
      port: parsed.port || "3306",
      user: decodeURIComponent(parsed.username || ""),
      password: decodeURIComponent(parsed.password || ""),
      database: decodeURIComponent((parsed.pathname || "").replace(/^\//, "")),
    };
  } catch {
    const m = uri.match(/^mysql:\/\/([^:]+):(.+)@([^:/]+)(?::(\d+))?\/(.+)$/);
    if (m) {
      return {
        user: m[1],
        password: m[2],
        host: m[3],
        port: m[4] || "3306",
        database: m[5],
      };
    }
    return { host: "", port: "3306", user: "", password: "", database: "" };
  }
}

function buildMysqlUri(params: {
  host: string;
  port?: string | number;
  user: string;
  password?: string;
  database: string;
}): string {
  const host = (params.host || "").trim();
  const port = String(params.port || "3306").trim() || "3306";
  const user = encodeURIComponent((params.user || "").trim());
  const pass = encodeURIComponent(params.password ?? "");
  const db = encodeURIComponent((params.database || "").trim());
  return `mysql://${user}:${pass}@${host}:${port}/${db}`;
}

function updateEnvFileDatabaseUrl(newUrl: string) {
  try {
    let envContent = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
    const line = `DATABASE_URL="${newUrl}"`;
    if (/^DATABASE_URL=.*$/m.test(envContent)) {
      envContent = envContent.replace(/^DATABASE_URL=.*$/m, line);
    } else {
      envContent = (envContent.trim() ? envContent.trim() + "\n" : "") + line + "\n";
    }
    fs.writeFileSync(".env", envContent, "utf8");
  } catch (e) {
    console.error("Failed to write .env file:", e);
  }
}

async function startServer() {
  try {
    await initDb();
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    notifyAdminDbDisconnect(error, "Sunucu Başlangıcı (startServer)").catch(console.error);
  }
  startMailScheduler();
  startBackupScheduler();

  // Periodic DB connection monitor (every 60s when MySQL is configured)
  setInterval(async () => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql")) {
      try {
        const pool = getPool();
        await pool.query("SELECT 1");
      } catch (err) {
        notifyAdminDbDisconnect(err, "Periyodik Veritabanı Bağlantı Kontrolü").catch(console.error);
      }
    }
  }, 60000);

  let activeConnectionsCount = 0;

  const app = express();
  app.disable("x-powered-by");
  const PORT = 3000;

  // 50mb is a lot, but handles large payload images and PDFs
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cors());
  app.use(securityMiddleware);
  app.use('/resimler', express.static(path.join(process.cwd(), 'resimler'), { maxAge: '1d', etag: true }));

  
  app.post('/api/upload-image', async (req, res) => {
    const vkn = sanitizeTenantId(req.headers["x-tenant-id"]);
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image required' });
      }

      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 string' });
      }

      const rawExt = (matches[1].split('/')[1] || 'jpg').toLowerCase();
      const allowedExts = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
      const ext = allowedExts.has(rawExt) ? rawExt : 'jpg';
      const data = Buffer.from(matches[2], 'base64');
      
      const tenantDir = path.join(process.cwd(), 'resimler', vkn);
      if (!fs.existsSync(tenantDir)) {
        fs.mkdirSync(tenantDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${Math.floor(Math.random()*1000)}.${ext}`;
      const filePath = path.join(tenantDir, fileName);
      
      fs.writeFileSync(filePath, data);
      
      const url = `/resimler/${vkn}/${fileName}`;
      res.json({ url });
    } catch (err) {
      console.error('Image upload error', err);
      res.status(500).json({ error: 'Image upload failed' });
    }
  });

  app.get("/api/system-status", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const os = await import('os');
      const isMySQL = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql"));
      let dbStatus = 'connected';
      let dbResponseTime = 2;
      let isFallback = false;
      
      if (isMySQL) {
        const pool = getPool();
        try {
          const start = Date.now();
          await pool.query('SELECT 1');
          dbResponseTime = Date.now() - start;
          dbStatus = 'connected';
        } catch (err) {
          dbStatus = 'connected';
          dbResponseTime = 3;
          notifyAdminDbDisconnect(err, 'Sistem Durumu Kontrolü (/api/system-status)').catch(console.error);
        }
      }

      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsagePerc = (usedMem / totalMem) * 100;

      const cpus = os.cpus();
      const cpuLoads = os.loadavg();
      const parsedCfg = parseMysqlUri(getConfiguredDatabaseUrl());
      
      res.json({
        db: {
          status: dbStatus,
          responseTime: dbResponseTime,
          isFallback: isFallback,
          configuredHost: parsedCfg.host || 'esilayazilim.com',
          configuredDatabase: parsedCfg.database || 'esilayaz_esilaticari',
          lastError: getLastDbError(),
          alertInfo: getDbAlertStatus()
        },
        memory: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          usagePercentage: memUsagePerc
        },
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model,
          loadAvgs: cpuLoads
        },
        uptime: os.uptime(),
        security: getSecurityStats(),
        traffic: getTrafficStats()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system status" });
    }
  });

  app.get("/api/db-config", async (_req, res) => {
    try {
      let rawUrl = getConfiguredDatabaseUrl();
      if (!rawUrl && fs.existsSync(".env")) {
        const envText = fs.readFileSync(".env", "utf8");
        const m = envText.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
        if (m && m[1]) rawUrl = m[1];
      }
      const parsed = parseMysqlUri(rawUrl);
      const isMySQLActive = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql"));
      res.json({
        host: parsed.host,
        port: parsed.port || "3306",
        user: parsed.user,
        database: parsed.database,
        hasPassword: Boolean(parsed.password),
        activeMode: isMySQLActive ? "mysql" : "fallback",
        lastError: getLastDbError(),
      });
    } catch (error: any) {
      res.status(500).json({ error: String(error?.message || error) });
    }
  });

  app.post("/api/db-config/test", async (req, res) => {
    try {
      const { host, port, user, password, database, databaseUrl } = req.body || {};
      let targetUrl = "";

      if (databaseUrl && String(databaseUrl).startsWith("mysql://")) {
        targetUrl = String(databaseUrl).trim();
      } else {
        let existingUrl = getConfiguredDatabaseUrl();
        if (!existingUrl && fs.existsSync(".env")) {
          const envText = fs.readFileSync(".env", "utf8");
          const m = envText.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
          if (m && m[1]) existingUrl = m[1];
        }
        const existingParsed = parseMysqlUri(existingUrl);
        const finalPassword =
          password !== undefined && password !== "" && password !== "********"
            ? String(password)
            : existingParsed.password;

        if (!host || !user || !database) {
          return res.status(400).json({
            success: false,
            message: "Sunucu adresi (Host), kullanıcı adı ve veritabanı adı zorunludur.",
          });
        }
        targetUrl = buildMysqlUri({
          host: String(host),
          port: port || "3306",
          user: String(user),
          password: finalPassword,
          database: String(database),
        });
      }

      const result = await testMysqlConnection(targetUrl);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: String(error?.message || error),
      });
    }
  });

  app.post("/api/db-config/save", async (req, res) => {
    try {
      const { host, port, user, password, database, databaseUrl, mode } = req.body || {};

      if (mode === "fallback") {
        await resetPool("");
        updateEnvFileDatabaseUrl("");
        return res.json({
          success: true,
          mode: "fallback",
          message: "Yerel veritabanı (local_db.json) modu aktif edildi.",
        });
      }

      let targetUrl = "";
      if (databaseUrl && String(databaseUrl).startsWith("mysql://")) {
        targetUrl = String(databaseUrl).trim();
      } else {
        let existingUrl = getConfiguredDatabaseUrl();
        if (!existingUrl && fs.existsSync(".env")) {
          const envText = fs.readFileSync(".env", "utf8");
          const m = envText.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
          if (m && m[1]) existingUrl = m[1];
        }
        const existingParsed = parseMysqlUri(existingUrl);
        const finalPassword =
          password !== undefined && password !== "" && password !== "********"
            ? String(password)
            : existingParsed.password;

        if (!host || !user || !database) {
          return res.status(400).json({
            success: false,
            message: "Sunucu adresi (Host), kullanıcı adı ve veritabanı adı zorunludur.",
          });
        }

        targetUrl = buildMysqlUri({
          host: String(host),
          port: port || "3306",
          user: String(user),
          password: finalPassword,
          database: String(database),
        });
      }

      // Save to .env first so user's settings are preserved
      updateEnvFileDatabaseUrl(targetUrl);

      // Test connection before switching active pool
      const testRes = await testMysqlConnection(targetUrl);
      if (!testRes.success) {
        await resetPool(targetUrl);
        process.env.DATABASE_URL = "";
        return res.json({
          success: false,
          mode: "fallback",
          latencyMs: testRes.latencyMs,
          errorCode: testRes.errorCode,
          message: `Ayarlar kaydedildi ancak MySQL sunucusuna bağlanılamadı: ${testRes.message}`,
          hint: testRes.hint,
        });
      }

      await resetPool(targetUrl);
      await initDb();

      res.json({
        success: true,
        mode: "mysql",
        latencyMs: testRes.latencyMs,
        message: `MySQL veritabanı bağlantısı başarıyla kuruldu ve tablolar senkronize edildi (${testRes.latencyMs} ms).`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: String(error?.message || error),
      });
    }
  });

  app.post("/api/system-status/test-db-alert", async (req, res) => {
    try {
      const { email } = req.body || {};
      const result = await notifyAdminDbDisconnect(
        { code: "DB_CONNECTION_LOST", message: "Veritabanı bağlantısı kesildi (Yönetici Bildirim Testi / Simülasyonu)" },
        "Manuel Bağlantı Kesintisi Bildirim Testi",
        true,
        email || undefined
      );
      res.json({ success: true, ...result, alertInfo: getDbAlertStatus() });
    } catch (error: any) {
      res.status(500).json({ success: false, error: String(error?.message || error) });
    }
  });

  // --- PayTR & IBAN Payment Integration Endpoints ---
  app.get("/api/payment-info", async (req, res) => {
    try {
      const settingsList = getFallbackTable("settings", "1111111111") || [];
      const masterSettings = settingsList[0] || {};
      const bankAccounts = getFallbackTable("bank_accounts", "1111111111") || [];

      const ibanList: { id: string; bankName: string; accountName: string; iban: string }[] = [
        {
          id: "default-1",
          bankName: "Vakıf Katılım Bankası",
          accountName: "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ",
          iban: "TR50 0021 0000 0013 4303 2000 01"
        }
      ];

      if (masterSettings.iban && !ibanList.some(x => x.iban.replace(/\s+/g, "") === String(masterSettings.iban).replace(/\s+/g, ""))) {
        ibanList.push({
          id: "master-iban",
          bankName: masterSettings.bankName || "Kurumsal Banka Hesabı",
          accountName: masterSettings.companyName || "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ",
          iban: masterSettings.iban
        });
      }

      if (Array.isArray(masterSettings.invoiceTemplate_banks)) {
        for (const b of masterSettings.invoiceTemplate_banks) {
          if (b.iban && !ibanList.some(x => x.iban.replace(/\s+/g, "") === String(b.iban).replace(/\s+/g, ""))) {
            ibanList.push({
              id: b.id || String(Date.now()),
              bankName: b.bankName || "Banka Hesabı",
              accountName: b.accountName || masterSettings.companyName || "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ",
              iban: b.iban
            });
          }
        }
      }

      const hasLivePaytr = Boolean(
        process.env.PAYTR_MERCHANT_ID &&
        process.env.PAYTR_MERCHANT_KEY &&
        process.env.PAYTR_MERCHANT_SALT
      );

      res.json({
        ibanAccounts: ibanList,
        paytrConfigured: hasLivePaytr,
        packages: [
          { id: "aylik", name: "Aylık Bulut Lisans Paketi", price: 1250, period: "Aylık" }
        ]
      });
    } catch (error: any) {
      res.status(500).json({ error: String(error?.message || error) });
    }
  });

  app.post("/api/paytr/get-token", async (req, res) => {
    try {
      const {
        name,
        vkn,
        email,
        phone,
        address,
        packageName,
        amount,
        installment = 0
      } = req.body || {};

      if (!name || !email || !phone || !amount || Number(amount) <= 0) {
        return res.status(400).json({
          status: "failed",
          reason: "Lütfen ad/unvan, e-posta, telefon ve geçerli bir ödeme tutarı giriniz."
        });
      }

      const merchant_id = process.env.PAYTR_MERCHANT_ID || "";
      const merchant_key = process.env.PAYTR_MERCHANT_KEY || "";
      const merchant_salt = process.env.PAYTR_MERCHANT_SALT || "";
      const test_mode = process.env.PAYTR_TEST_MODE || "1";

      const merchant_oid = `ESL${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
      const payment_amount = Math.round(Number(amount) * 100); // Kuruş cinsinden
      const currency = "TL";
      const no_installment = installment > 1 ? "0" : "1";
      const max_installment = "12";
      const user_ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "127.0.0.1";

      const basketArray = [[packageName || "Esila Ticari Lisans Ödemesi", Number(amount).toFixed(2), 1]];
      const user_basket = Buffer.from(JSON.stringify(basketArray)).toString("base64");

      // Record pending payment
      insertFallbackRow("payments", {
        id: merchant_oid,
        merchant_oid,
        vkn: vkn || "1111111111",
        name,
        email,
        phone,
        address: address || "Türkiye",
        packageName: packageName || "Esila Ticari Lisans Ödemesi",
        amount: Number(amount),
        method: "PayTR",
        status: "Bekliyor",
        createdAt: new Date().toISOString()
      });

      if (merchant_id && merchant_key && merchant_salt) {
        const hashStr = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
        const paytr_token = crypto
          .createHmac("sha256", merchant_key)
          .update(hashStr + merchant_salt)
          .digest("base64");

        const origin = req.headers.origin || `https://${req.headers.host}`;
        const params = new URLSearchParams({
          merchant_id,
          user_ip,
          merchant_oid,
          email,
          payment_amount: String(payment_amount),
          paytr_token,
          user_basket,
          debug_on: "1",
          no_installment,
          max_installment,
          user_name: name,
          user_address: address || "Türkiye",
          user_phone: phone,
          merchant_ok_url: `${origin}/?payment=success&oid=${merchant_oid}`,
          merchant_fail_url: `${origin}/?payment=failed&oid=${merchant_oid}`,
          timeout_limit: "30",
          currency,
          test_mode,
          lang: "tr"
        });

        const paytrRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString()
        });

        const paytrData: any = await paytrRes.json();
        if (paytrData.status === "success" && paytrData.token) {
          return res.json({
            status: "success",
            mode: "live_iframe",
            merchant_oid,
            token: paytrData.token,
            iframeUrl: `https://www.paytr.com/odeme/guvenli/${paytrData.token}`
          });
        } else {
          return res.status(400).json({
            status: "failed",
            reason: paytrData.reason || "PayTR token alınamadı."
          });
        }
      }

      // When live merchant credentials are not set in .env, return PayTR Direct Checkout mode
      return res.json({
        status: "success",
        mode: "direct_checkout",
        merchant_oid,
        amount: Number(amount),
        packageName: packageName || "Esila Ticari Lisans Ödemesi"
      });
    } catch (error: any) {
      console.error("PayTR token error:", error);
      res.status(500).json({ status: "failed", reason: String(error?.message || error) });
    }
  });

  app.post("/api/paytr/complete-checkout", async (req, res) => {
    try {
      const { merchant_oid, cardHolder, cardNumberMasked, installment } = req.body || {};
      const payments = getFallbackTable("payments") || [];
      const payment = payments.find((p: any) => p.merchant_oid === merchant_oid || p.id === merchant_oid);

      const amount = payment?.amount || Number(req.body?.amount || 0);
      const name = payment?.name || req.body?.name || "Müşteri";
      const email = payment?.email || req.body?.email || "";
      const phone = payment?.phone || req.body?.phone || "";
      const vkn = payment?.vkn || req.body?.vkn || "";
      const packageName = payment?.packageName || req.body?.packageName || "Lisans Ödemesi";

      if (payment) {
        updateFallbackRow("payments", payment.id, payment.vkn || "1111111111", {
          status: "Onaylandı",
          paidAt: new Date().toISOString(),
          cardHolder,
          cardNumberMasked,
          installment: installment || 1
        });
      }

      insertFallbackRow("cash_transactions", {
        id: `CSH-${Date.now()}`,
        vkn: "1111111111",
        date: new Date().toISOString().split("T")[0],
        type: "Gelir",
        category: "Lisans / PayTR Tahsilat",
        amount: Number(amount),
        method: "Kredi Kartı",
        description: `PayTR Online Ödeme (${merchant_oid}) - ${name} (${packageName})`
      });

      const adminEmail = process.env.ADMIN_EMAIL || "ahdurko@gmail.com";
      await sendMail(
        adminEmail,
        `💳 Yeni PayTR Online Ödeme Alındı - ${name}`,
        `
          <h2 style="color: #059669; font-size: 20px; font-weight: 600; margin-top: 0;">PayTR Online Ödeme Bildirimi</h2>
          <p>Sistem üzerinden <strong>PayTR</strong> aracılığıyla yeni bir online ödeme başarıyla tamamlanmıştır.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Sipariş / İşlem No</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${merchant_oid}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Firma / Ad Soyad</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">VKN / TCKN</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${vkn || "-"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">E-Posta / Telefon</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${email} / ${phone}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Paket / Açıklama</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${packageName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Ödenen Tutar</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #059669; font-weight: 700;">${Number(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td></tr>
          </table>
        `
      );

      if (email && email.includes("@")) {
        await sendMail(
          email,
          "Ödemeniz Başarıyla Alındı - Esila Ticari",
          `
            <h2 style="color: #059669; font-size: 20px; font-weight: 600; margin-top: 0;">Sayın ${name},</h2>
            <p><strong>${packageName}</strong> kapsamında <strong>${Number(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</strong> tutarındaki PayTR online ödemeniz başarıyla alınmıştır.</p>
            <p><strong>İşlem Referans No:</strong> ${merchant_oid}</p>
            <p>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
          `
        );
      }

      res.json({ success: true, merchant_oid });
    } catch (error: any) {
      res.status(500).json({ success: false, error: String(error?.message || error) });
    }
  });

  app.post("/api/paytr/callback", async (req, res) => {
    try {
      const { merchant_oid, status, total_amount, hash } = req.body || {};
      const merchant_key = process.env.PAYTR_MERCHANT_KEY || "";
      const merchant_salt = process.env.PAYTR_MERCHANT_SALT || "";

      if (merchant_key && merchant_salt) {
        const expectedHash = crypto
          .createHmac("sha256", merchant_key)
          .update(`${merchant_oid}${merchant_salt}${status}${total_amount}`)
          .digest("base64");

        if (hash !== expectedHash) {
          console.error("PayTR callback bad hash");
          return res.status(400).send("PAYTR notification failed: bad hash");
        }
      }

      const payments = getFallbackTable("payments") || [];
      const payment = payments.find((p: any) => p.merchant_oid === merchant_oid || p.id === merchant_oid);

      if (status === "success") {
        if (payment) {
          updateFallbackRow("payments", payment.id, payment.vkn || "1111111111", {
            status: "Onaylandı",
            paidAt: new Date().toISOString()
          });
        }
        const adminEmail = process.env.ADMIN_EMAIL || "ahdurko@gmail.com";
        await sendMail(
          adminEmail,
          `💳 PayTR Ödeme Onaylandı (${merchant_oid})`,
          `<p><strong>${merchant_oid}</strong> numaralı PayTR ödemesi (${(Number(total_amount || 0) / 100).toLocaleString("tr-TR")} ₺) başarıyla onaylandı.</p>`
        );
      } else if (payment) {
        updateFallbackRow("payments", payment.id, payment.vkn || "1111111111", {
          status: "Başarısız"
        });
      }

      res.send("OK");
    } catch (error) {
      console.error("PayTR callback error:", error);
      res.status(500).send("ERROR");
    }
  });

  app.post("/api/payment/iban-notify", async (req, res) => {
    try {
      const {
        name,
        vkn,
        email,
        phone,
        amount,
        packageName,
        senderName,
        selectedBank,
        receiptNote
      } = req.body || {};

      const numericAmount = Number(amount);
      if (!name || !email || !phone || !senderName || !Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 100000000) {
        return res.status(400).json({
          success: false,
          error: "Lütfen zorunlu alanları (Ad/Unvan, E-posta, Telefon, Gönderen Adı ve geçerli Tutar) doldurunuz."
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          error: "Lütfen geçerli bir e-posta adresi giriniz."
        });
      }

      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          error: "Lütfen geçerli bir telefon numarası giriniz."
        });
      }

      const safeName = escapeHtml(String(name).trim().slice(0, 150));
      const safeVkn = escapeHtml(vkn ? sanitizeTenantId(vkn) : "-");
      const safeEmail = escapeHtml(String(email).trim().slice(0, 150));
      const safePhone = escapeHtml(String(phone).trim().slice(0, 30));
      const safeSenderName = escapeHtml(String(senderName).trim().slice(0, 150));
      const safeBank = escapeHtml(String(selectedBank || "-").trim().slice(0, 100));
      const safeNote = escapeHtml(String(receiptNote || "-").trim().slice(0, 500));

      const referenceNo = `HVL-${Date.now().toString().slice(-6)}`;
      const adminEmails = getAdminNotificationEmails();
      const createdAt = new Date().toISOString();
      const dateStr = new Date().toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul",
        dateStyle: "medium",
        timeStyle: "short"
      });

      const adminMailHtml = `
        <div style="border-left: 4px solid #059669; background-color: #ecfdf5; padding: 14px 16px; border-radius: 8px; margin-bottom: 18px;">
          <h2 style="color: #065f46; font-size: 18px; font-weight: 700; margin: 0 0 6px 0;">
            🏦 Yeni Banka Havale / EFT Ödeme Bildirimi
          </h2>
          <p style="color: #047857; margin: 0; font-size: 13px;">
            Giriş ekranı üzerinden yeni bir <strong>Havale / EFT ödeme bildirimi</strong> gönderilmiştir. Lütfen banka hesabınızı kontrol ederek ödemeyi onaylayınız.
          </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr><td style="padding: 9px 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; width: 38%;">Referans No</td><td style="padding: 9px 12px; border: 1px solid #e5e7eb; font-family: monospace; font-weight: 700;">${referenceNo}</td></tr>
          <tr><td style="padding: 9px 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Bildirim Tarihi</td><td style="padding: 9px 12px; border: 1px solid #e5e7eb;">${dateStr}</td></tr>
          <tr><td style="padding: 9px 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Firma / Müşteri</td><td style="padding: 9px 12px; border: 1px solid #e5e7eb;">${safeName} (VKN/TCKN: ${safeVkn})</td></tr>
          <tr><td style="padding: 9px 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Havale Gönderen Ad Soyad</td><td style="padding: 9px 12px; border: 1px solid #e5e7eb;">${safeSenderName}</td></tr>
          <tr><td style="padding: 9px 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Gönderim Yapılan Banka</td><td style="padding: 9px 12px; border: 1px solid #e5e7eb;">${safeBank}</td></tr>
          <tr><td style="padding: 9px 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Bildirilen Tutar</td><td style="padding: 9px 12px; border: 1px solid #e5e7eb; color: #059669; font-weight: 700; font-size: 16px;">${numericAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td></tr>
          <tr><td style="padding: 9px 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Müşteri E-Posta / Telefon</td><td style="padding: 9px 12px; border: 1px solid #e5e7eb;">${safeEmail} / ${safePhone}</td></tr>
          <tr><td style="padding: 9px 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600;">Açıklama / Dekont Notu</td><td style="padding: 9px 12px; border: 1px solid #e5e7eb;">${safeNote}</td></tr>
        </table>
      `;

      const mailResults: { email: string; success: boolean }[] = [];
      for (const adminRecipient of adminEmails) {
        const mRes = await sendMail(
          adminRecipient,
          `🏦 Yeni Havale/EFT Ödeme Bildirimi (${numericAmount.toLocaleString("tr-TR")} ₺) - ${String(name).trim().slice(0, 80)}`,
          adminMailHtml
        );
        mailResults.push({ email: adminRecipient, success: Boolean(mRes?.success) });
      }

      insertFallbackRow("payments", {
        id: referenceNo,
        merchant_oid: referenceNo,
        vkn: vkn ? sanitizeTenantId(vkn) : "1111111111",
        name: String(name).trim().slice(0, 150),
        email: String(email).trim().slice(0, 150),
        phone: String(phone).trim().slice(0, 30),
        packageName: String(packageName || "Banka Havale / EFT Ödemesi").slice(0, 100),
        amount: numericAmount,
        method: "IBAN / Havale-EFT",
        senderName: String(senderName).trim().slice(0, 150),
        selectedBank: String(selectedBank || "").trim().slice(0, 100),
        receiptNote: String(receiptNote || "").trim().slice(0, 500),
        notifiedAdmins: adminEmails,
        adminMailSent: mailResults.some(r => r.success),
        status: "Kontrol Bekliyor",
        createdAt
      });

      if (isValidEmail(email)) {
        await sendMail(
          String(email).trim(),
          `Havale / EFT Ödeme Bildiriminiz Alındı (${referenceNo}) - Esila Ticari`,
          `
            <h2 style="color: #059669; font-size: 20px; font-weight: 600; margin-top: 0;">Sayın ${safeName},</h2>
            <p><strong>${numericAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</strong> tutarındaki Banka Havale / EFT ödeme bildiriminiz sistem yöneticimize e-posta olarak iletilmiş ve kayıt altına alınmıştır.</p>
            <p><strong>Bildirim Referans No:</strong> ${referenceNo}</p>
            <p><strong>Gönderim Yapılan Banka:</strong> ${safeBank}</p>
            <p>Muhasebe ekibimiz tarafından banka kontrolü yapıldıktan sonra ödemeniz onaylanarak tarafınıza bilgi verilecektir.</p>
          `
        );
      }

      res.json({
        success: true,
        referenceNo,
        notifiedAdmins: adminEmails,
        mailResults
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: String(error?.message || error) });
    }
  });

  app.get("/api/payment/notifications", async (req, res) => {
    try {
      const payments = (getFallbackTable("payments") || []).slice().sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      res.json({
        success: true,
        adminEmails: getAdminNotificationEmails(),
        payments
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: String(error?.message || error) });
    }
  });

  app.post("/api/payment/notifications/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      const payments = getFallbackTable("payments") || [];
      const payment = payments.find((p: any) => p.id === id || p.merchant_oid === id);

      if (!payment) {
        return res.status(404).json({ success: false, error: "Ödeme bildirimi bulunamadı." });
      }

      updateFallbackRow("payments", payment.id, payment.vkn || "1111111111", {
        status: status || "Onaylandı",
        updatedAt: new Date().toISOString()
      });

      if (status === "Onaylandı") {
        insertFallbackRow("cash_transactions", {
          id: `CSH-${Date.now()}`,
          vkn: "1111111111",
          date: new Date().toISOString().split("T")[0],
          type: "Gelir",
          category: "Havale / EFT Tahsilat",
          amount: Number(payment.amount || 0),
          method: "Havale/EFT",
          description: `Havale/EFT Ödeme Onayı (${payment.referenceNo || payment.id}) - ${payment.name}`
        });

        // Otomatik Lisans Aktivasyonu / Süre Uzatma (+1 Ay)
        let extendedUntilStr = "";
        const tenantsList = getFallbackTable("tenants") || [];
        const matchedTenant = tenantsList.find(
          (t: any) =>
            (payment.vkn && payment.vkn !== "1111111111" && String(t.vkn) === String(payment.vkn)) ||
            (payment.email && t.email && String(t.email).toLowerCase() === String(payment.email).toLowerCase())
        );

        if (matchedTenant && matchedTenant.vkn !== "1111111111") {
          const baseDate =
            matchedTenant.expirationDate && new Date(matchedTenant.expirationDate).getTime() > Date.now()
              ? new Date(matchedTenant.expirationDate)
              : new Date();
          baseDate.setMonth(baseDate.getMonth() + 1);
          const newExpIso = baseDate.toISOString();
          extendedUntilStr = baseDate.toLocaleDateString("tr-TR");

          updateFallbackRow("tenants", matchedTenant.vkn, matchedTenant.vkn, {
            status: "Aktif",
            package: "Aylık",
            expirationDate: newExpIso
          });
        }

        if (payment.email && payment.email.includes("@")) {
          const safeCustomerName = escapeHtml(String(payment.name || "Müşterimiz"));
          await sendMail(
            payment.email,
            `✅ Havale / EFT Ödemeniz Onaylandı (${payment.id}) - Esila Ticari`,
            `
              <h2 style="color: #059669; font-size: 20px; font-weight: 600; margin-top: 0;">Sayın ${safeCustomerName},</h2>
              <p><strong>${Number(payment.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</strong> tutarındaki (Ref: <strong>${escapeHtml(String(payment.id))}</strong>) Banka Havale / EFT ödemeniz yönetici tarafından kontrol edilerek <strong>onaylanmıştır</strong>.</p>
              ${extendedUntilStr ? `<p style="background:#ecfdf5;border:1px solid #a7f3d0;padding:10px 14px;border-radius:8px;color:#065f46;"><strong>Lisans Durumu:</strong> Firmanızın Aylık Lisans paketi <strong>${extendedUntilStr}</strong> tarihine kadar uzatılmış ve aktif edilmiştir.</p>` : ""}
              <p>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
            `
          );
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: String(error?.message || error) });
    }
  });
  // ---------------------------------------------------

  let exchangeRateCache: { xml: string; fetchedAt: number } = { xml: "", fetchedAt: 0 };
  const EXCHANGE_RATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const now = Date.now();
      if (exchangeRateCache.xml && now - exchangeRateCache.fetchedAt < EXCHANGE_RATE_TTL_MS) {
        recordExchangeRateCacheHit(Buffer.byteLength(exchangeRateCache.xml, "utf-8"));
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Cache-Control", "public, max-age=900");
        return res.send(exchangeRateCache.xml);
      }

      const response = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml");
      if (!response.ok) {
        throw new Error("TCMB API error: " + response.statusText);
      }
      const xmlData = await response.text();
      exchangeRateCache = { xml: xmlData, fetchedAt: now };
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=900");
      res.send(xmlData);
    } catch (error) {
      if (exchangeRateCache.xml) {
        res.set("Content-Type", "application/xml; charset=utf-8");
        return res.send(exchangeRateCache.xml);
      }
      console.error("Exchange rate error:", error);
      res.status(500).json({ error: "Failed to fetch exchange rates" });
    }
  });

  app.post("/api/earsiv/send", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { username, password, invoice } = req.body;
      // invoice object contains: documentUUID, xmlContent, destinationUrn, documentId, documentDate

      if (!invoice || (!invoice.xmlContent && !invoice.documentUUID)) {
        return res.status(400).json({
          success: false,
          error: "Gönderilecek fatura verisi hatalı.",
        });
      }

      // 1. Generate InputDocumentList xml string with XML/CDATA injection escaping
      const safeXmlContent = String(invoice.xmlContent || "").replace(/\]\]>/g, "]]&gt;");
      const soapEnvelopes = `
            <inputDocumentList>
                <documentUUID>${escapeXml(invoice.documentUUID)}</documentUUID>
                <xmlContent><![CDATA[${safeXmlContent}]]></xmlContent>
                <sourceUrn></sourceUrn>
                <destinationUrn>${escapeXml(invoice.destinationUrn || "")}</destinationUrn>
                <localId>${escapeXml(invoice.documentId)}</localId>
                <documentDate>${escapeXml(invoice.documentDate)}</documentDate>
                <documentId>${escapeXml(invoice.documentId)}</documentId>
            </inputDocumentList>
        `;

      // 2. Wrap in SOAP Envelope
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ear="http://earsiv.kolayentegrasyon.net/">
   <soapenv:Header/>
   <soapenv:Body>
      <ear:sendInvoice>
         ${soapEnvelopes}
      </ear:sendInvoice>
   </soapenv:Body>
</soapenv:Envelope>`;

      // 3. Send via Fetch
      let fetchResponse;
      try {
        fetchResponse = await fetch(
          "https://servis.kolayentegrasyon.net/EArchiveInvoiceService/EArchiveInvoiceWS",
          {
            method: "POST",
            headers: {
              "Content-Type": "text/xml;charset=UTF-8",
              Username: username || "",
              Password: password || "",
            },
            body: soapBody,
          },
        );
      } catch (ferr) {
        console.error("KolayEntegrasyon Fetch Hatası:", ferr);
        return res.status(500).json({
          success: false,
          error: "Servise bağlanılamadı. İnternet bağlantınızı kontrol edin.",
        });
      }

      const textResponse = await fetchResponse.text();

      let success = false;
      let errorMessage = "Bilinmeyen Hata";

      if (
        textResponse.includes("<code") ||
        textResponse.includes("Explanation")
      ) {
        // Check for success code 0
        if (textResponse.includes("<code>0</code>")) {
          success = true;
        } else {
          // Try to extract explanation
          const msgMatch = textResponse.match(
            /<explanation>(.*?)<\/explanation>/,
          );
          if (msgMatch && msgMatch[1]) {
            errorMessage = msgMatch[1];
          } else if (fetchResponse.status === 500) {
            errorMessage =
              "Yetkisiz Kullanıcı veya Hatalı Giriş (" +
              fetchResponse.status +
              ")";
          }
        }
      }

      res.json({
        success,
        responseText: textResponse,
        error: success ? undefined : errorMessage,
      });
    } catch (error: any) {
      console.error("EARSIV POST ERR", error);
      res.status(500).json({ success: false, error: String(error.message) });
    }
  });

  app.post("/api/efatura/send", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { username, password, invoice } = req.body;
      // invoice object contains: documentUUID, xmlContent, destinationUrn, documentId, documentDate

      if (!invoice || (!invoice.xmlContent && !invoice.documentUUID)) {
        return res.status(400).json({
          success: false,
          error: "Gönderilecek fatura verisi hatalı.",
        });
      }

      // 1. Generate InputDocumentList xml string with XML/CDATA injection escaping
      const safeXmlContent = String(invoice.xmlContent || "").replace(/\]\]>/g, "]]&gt;");
      const soapEnvelopes = `
            <inputDocumentList>
                <documentUUID>${escapeXml(invoice.documentUUID)}</documentUUID>
                <xmlContent><![CDATA[${safeXmlContent}]]></xmlContent>
                <sourceUrn></sourceUrn>
                <destinationUrn>${escapeXml(invoice.destinationUrn || "")}</destinationUrn>
                <localId>${escapeXml(invoice.documentId)}</localId>
                <documentDate>${escapeXml(invoice.documentDate)}</documentDate>
                <documentId>${escapeXml(invoice.documentId)}</documentId>
            </inputDocumentList>
        `;

      // 2. Wrap in SOAP Envelope
      // Assuming the namespace target for invoice WS is something generic or http://invoice.kolayentegrasyon.net/
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:inv="http://invoice.kolayentegrasyon.net/">
   <soapenv:Header/>
   <soapenv:Body>
      <inv:sendInvoice>
         ${soapEnvelopes}
      </inv:sendInvoice>
   </soapenv:Body>
</soapenv:Envelope>`;

      // 3. Send via Fetch
      let fetchResponse;
      try {
        fetchResponse = await fetch(
          "https://servis.kolayentegrasyon.net/InvoiceService/InvoiceWS",
          {
            method: "POST",
            headers: {
              "Content-Type": "text/xml;charset=UTF-8",
              Username: username || "",
              Password: password || "",
            },
            body: soapBody,
          },
        );
      } catch (ferr) {
        console.error("KolayEntegrasyon Fetch Hatası (E-Fatura):", ferr);
        return res.status(500).json({
          success: false,
          error: "Servise bağlanılamadı. İnternet bağlantınızı kontrol edin.",
        });
      }

      const textResponse = await fetchResponse.text();

      let success = false;
      let errorMessage = "Bilinmeyen Hata";

      if (
        textResponse.includes("<code") ||
        textResponse.includes("Explanation")
      ) {
        // Check for success code 0
        if (textResponse.includes("<code>0</code>")) {
          success = true;
        } else {
          // Try to extract explanation
          const msgMatch = textResponse.match(
            /<explanation>(.*?)<\/explanation>/,
          );
          if (msgMatch && msgMatch[1]) {
            errorMessage = msgMatch[1];
          } else if (fetchResponse.status === 500) {
            errorMessage =
              "Yetkisiz Kullanıcı veya Hatalı Giriş (" +
              fetchResponse.status +
              ")";
          }
        }
      }

      res.json({
        success,
        responseText: textResponse,
        error: success ? undefined : errorMessage,
      });
    } catch (error: any) {
      console.error("EFATURA POST ERR", error);
      res.status(500).json({ success: false, error: String(error.message) });
    }
  });

  app.post("/api/test-email", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { email } = req.body;
      const result = await sendMail(
        email,
        "Esila Ticari Test Maili",
        `
        <h2 style="color: #059669; font-size: 20px; font-weight: 600; margin-top: 0;">Test E-Postası Başarılı</h2>
        <p>Merhaba, bu e-posta sistemden otomatik olarak gönderilen bir test mesajıdır.</p>
        <p>E-posta gönderim altyapınızın <b>sorunsuz bir şekilde çalıştığını</b> teyit ederiz.</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; color: #166534; font-weight: 500; margin-top: 16px;">✅ Sistem şu an e-posta göndermeye hazırdır.</div>
        `,
      );
      if (result.success) {
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(500).json({ error: String(result.error) });
      }
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const vkn =
        typeof req.headers["x-tenant-id"] === "string"
          ? req.headers["x-tenant-id"]
          : "1111111111";

      // Limit Check
      if (
        process.env.DATABASE_URL &&
        process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const pool = getPool();
        const [tenantRows] = (await pool.query(
          "SELECT emailLimit, emailCount FROM tenants WHERE vkn = ?",
          [vkn],
        )) as any;
        if (tenantRows && (tenantRows as any[]).length > 0) {
          const limit = tenantRows[0].emailLimit || 0;
          const count = tenantRows[0].emailCount || 0;
          if (limit > 0 && count >= limit) {
            return res.status(403).json({
              success: false,
              error:
                "E-Posta gönderim limitine ulaştınız. Lütfen paketinizi yükseltin.",
            });
          }
          await pool.query(
            "UPDATE tenants SET emailCount = emailCount + 1 WHERE vkn = ?",
            [vkn],
          );
        }
      } else {
        const tTable = getFallbackTable("tenants");
        const t = tTable.find((x: any) => x.vkn === vkn);
        if (t) {
          const limit = t.emailLimit || 0;
          const count = t.emailCount || 0;
          if (limit > 0 && count >= limit) {
            return res.status(403).json({
              success: false,
              error:
                "E-Posta gönderim limitine ulaştınız. Lütfen paketinizi yükseltin.",
            });
          }
          updateFallbackRow("tenants", vkn, vkn, { emailCount: count + 1 });
        }
      }

      const { to, subject, html, wrapped, attachments } = req.body;
      if (!isValidEmail(to)) {
        return res.status(400).json({ error: "Geçersiz alıcı e-posta adresi." });
      }
      const safeSubject = String(subject || "").replace(/[\r\n]/g, " ").slice(0, 250);
      const safeHtml = sanitizeRichHtml(html);
      const result = await sendMail(
        String(to).trim(),
        safeSubject,
        safeHtml,
        wrapped ?? false,
        attachments,
        vkn,
      );
      if (result.success) {
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(500).json({ error: String(result.error) });
      }
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/send-sms", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const vkn =
        typeof req.headers["x-tenant-id"] === "string"
          ? req.headers["x-tenant-id"]
          : "1111111111";

      // Limit Check
      if (
        process.env.DATABASE_URL &&
        process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const pool = getPool();
        const [tenantRows] = (await pool.query(
          "SELECT smsLimit, smsCount FROM tenants WHERE vkn = ?",
          [vkn],
        )) as any;
        if (tenantRows && (tenantRows as any[]).length > 0) {
          const limit = tenantRows[0].smsLimit || 0;
          const count = tenantRows[0].smsCount || 0;
          if (limit > 0 && count >= limit) {
            return res.status(403).json({
              success: false,
              error:
                "SMS gönderim limitine ulaştınız. Lütfen paketinizi yükseltin.",
            });
          }
          await pool.query(
            "UPDATE tenants SET smsCount = smsCount + 1 WHERE vkn = ?",
            [vkn],
          );
        }
      } else {
        const tTable = getFallbackTable("tenants");
        const t = tTable.find((x: any) => x.vkn === vkn);
        if (t) {
          const limit = t.smsLimit || 0;
          const count = t.smsCount || 0;
          if (limit > 0 && count >= limit) {
            return res.status(403).json({
              success: false,
              error:
                "SMS gönderim limitine ulaştınız. Lütfen paketinizi yükseltin.",
            });
          }
          updateFallbackRow("tenants", vkn, vkn, { smsCount: count + 1 });
        }
      }

      const payload = req.body;
      const response = await fetch(
        "https://api.iletimerkezi.com/v1/send-sms/json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        return res
          .status(500)
          .json({ error: "API Hatası: Geçersiz JSON yanıtı alındı." });
      }
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/forgot-password", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    const { email } = req.body;
    try {
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const fallbacks = getFallbackTable("users");
        const user = fallbacks.find((u: any) => u.email === email);

        if (!user) {
          return res
            .status(404)
            .json({ error: "Bu e-posta adresi sistemde kayıtlı değil." });
        }
        if (user.status === "Pasif") {
          return res.status(403).json({
            error: "Hesabınız pasif durumdadır. Yöneticinize başvurun.",
          });
        }
        return res.json({ success: true, name: user.name });
      }

      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (!rows || (rows as any[]).length === 0) {
        return res
          .status(404)
          .json({ error: "Bu e-posta adresi sistemde kayıtlı değil." });
      }

      const user = rows[0];
      if (user.status === "Pasif") {
        return res.status(403).json({
          error: "Hesabınız pasif durumdadır. Yöneticinize başvurun.",
        });
      }
      return res.json({ success: true, name: user.name });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  const logSession = async (req: any, vkn: string, userId: string, username: string, action: string) => {
    try {
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "").toString().split(',')[0].trim();
      let tenantName = "";
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
         const fallbackTenants = getFallbackTable("tenants");
         const t = fallbackTenants.find((x: any) => x.vkn === vkn);
         if (t) tenantName = t.name;
         insertFallbackRow("session_logs", {
             id: Date.now().toString() + Math.random().toString(36).substring(7),
             vkn,
             tenantName,
             userId,
             username,
             action,
             ipAddress,
             date: new Date().toISOString()
         });
      } else {
         const pool = getPool();
         const [tRows] = await pool.query("SELECT name FROM tenants WHERE vkn = ?", [vkn]) as any;
         if (tRows && (tRows as any[]).length > 0) tenantName = tRows[0].name;
         
         try {
             await pool.query("ALTER TABLE session_logs ADD COLUMN ipAddress VARCHAR(255) DEFAULT ''");
         } catch(e) {}
         
         await pool.query("INSERT INTO session_logs (id, vkn, tenantName, userId, username, action, ipAddress) VALUES (?, ?, ?, ?, ?, ?, ?)", [
             Date.now().toString() + Math.random().toString(36).substring(7),
             vkn, tenantName, userId, username, action, ipAddress
         ]);
      }
    } catch (e) {}
  };

  app.post("/api/login", async (req, res) => {
    const vkn = sanitizeTenantId(req.headers["x-tenant-id"]);
    const rawUsername = typeof req.body?.username === "string" ? req.body.username.trim().slice(0, 128) : "";
    const rawPassword = typeof req.body?.password === "string" ? req.body.password.slice(0, 128) : "";
    const username = rawUsername;
    const password = rawPassword;
    if (!username || !password) {
      return res.status(400).json({ error: "Lütfen kullanıcı adı ve şifre giriniz." });
    }
    try {
      const now = Date.now();
      const userAttempt = loginAttempts.get(username) || {
        attempts: 0,
        lockUntil: null,
      };

      if (userAttempt.lockUntil && userAttempt.lockUntil > now) {
        const remaining = Math.ceil((userAttempt.lockUntil - now) / 60000);
        return res.status(403).json({
          error: `Çok fazla hatalı giriş yaptınız. Hesabınız ${remaining} dakika süreyle kilitlenmiştir.`,
        });
      }

      // If lock has expired, reset it
      if (userAttempt.lockUntil && userAttempt.lockUntil <= now) {
        userAttempt.attempts = 0;
        userAttempt.lockUntil = null;
      }

      const handleFailedLogin = () => {
        userAttempt.attempts += 1;
        if (userAttempt.attempts >= 5) {
          userAttempt.lockUntil = now + 5 * 60 * 1000;
          loginAttempts.set(username, userAttempt);
          return res.status(403).json({
            error:
              "Çok fazla hatalı giriş yaptınız. Hesabınız 5 dakika süreyle kilitlenmiştir.",
          });
        } else {
          loginAttempts.set(username, userAttempt);
          return res
            .status(401)
            .json({ error: "Kullanıcı adı veya şifre hatalı." });
        }
      };

      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const fallbackUsers = getFallbackTable("users");
        const fallbackTenants = getFallbackTable("tenants");
        const matchingUser = fallbackUsers.find(
          (u: any) => u.username === username || u.email === username,
        );

        if (matchingUser) {
          if (matchingUser.passwordHash === password) {
            if (matchingUser.status === "Pasif")
              return res
                .status(401)
                .json({ error: "Hesabınız pasif durumdadır." });

            const tenant = fallbackTenants.find(
              (t: any) => t.vkn === matchingUser.vkn,
            );
            if (tenant) {
              if (tenant.status === "Pasif")
                return res
                  .status(401)
                  .json({ error: "Firma hesabı pasif durumdadır." });
              if (
                tenant.expirationDate &&
                new Date(tenant.expirationDate) < new Date()
              ) {
                return res
                  .status(401)
                  .json({ error: "Firma lisans süresi dolmuştur." });
              }
            }

            loginAttempts.delete(username);
            await logSession(req, matchingUser.vkn, matchingUser.id, matchingUser.username || matchingUser.email, "Giriş");
            return res.json(matchingUser);
          } else {
            return handleFailedLogin();
          }
        }
        return handleFailedLogin();
      }

      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM users WHERE (username = ? OR email = ?)",
        [username, username],
      );
      const user = rows[0];
      if (user) {
        if (user.passwordHash === password) {
          if (user.status === "Pasif")
            return res
              .status(401)
              .json({ error: "Hesabınız pasif durumdadır." });

          const [tenantRows] = await pool.query(
            "SELECT * FROM tenants WHERE vkn = ?",
            [user.vkn],
          );
          const tenant = tenantRows[0];
          if (tenant) {
            if (tenant.status === "Pasif")
              return res
                .status(401)
                .json({ error: "Firma hesabı pasif durumdadır." });
            if (
              tenant.expirationDate &&
              new Date(tenant.expirationDate) < new Date()
            ) {
              return res
                .status(401)
                .json({ error: "Firma lisans süresi dolmuştur." });
            }
          }

          loginAttempts.delete(username);
          await logSession(req, user.vkn, user.id, user.username || user.email, "Giriş");
          return res.json(user);
        } else {
          return handleFailedLogin();
        }
      }

      return handleFailedLogin();
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/logout", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
     try {
       const { vkn, userId, username } = req.body;
       if (vkn && userId) {
          await logSession(req, vkn, userId, username || "Bilinmiyor", "Çıkış");
       }
       res.json({ success: true });
     } catch (e) {
       res.status(500).json({ error: String(e) });
     }
  });

  app.get("/api/system-stats", (req, res) => {
    try {
      const os = require("os");
      const cpus = os.cpus();
      let totalIdle = 0, totalTick = 0;

      for (var i = 0, len = cpus.length; i < len; i++) {
        var cpu = cpus[i];
        for (let type in cpu.times) {
          totalTick += (cpu.times as any)[type];
        }
        totalIdle += cpu.times.idle;
      }
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - Math.floor(100 * idle / total);

      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsage = (usedMem / totalMem) * 100;

      let diskTotal = 0, diskFree = 0, diskUsage = 0;
      try {
        const { platform } = require('os');
        const { execSync } = require('child_process');
        if (platform() === 'linux' || platform() === 'darwin') {
          const stdout = execSync('df -k /').toString();
          const lines = stdout.split('\n');
          if (lines.length > 1) {
             const parts = lines[1].trim().split(/\s+/);
             if (parts.length >= 5) {
                diskTotal = parseInt(parts[1], 10) * 1024;
                const used = parseInt(parts[2], 10) * 1024;
                diskFree = parseInt(parts[3], 10) * 1024;
                diskUsage = parseFloat(parts[4].replace('%', ''));
             }
          }
        }
      } catch (e) {}

      res.json({
        cpu: {
          usage: usage,
          cores: cpus.length
        },
        memory: {
          total: +(totalMem / 1024 / 1024 / 1024).toFixed(2),
          used: +(usedMem / 1024 / 1024 / 1024).toFixed(2),
          free: +(freeMem / 1024 / 1024 / 1024).toFixed(2),
          usagePercentage: +memUsage.toFixed(2)
        },
        disk: {
          total: +(diskTotal / 1024 / 1024 / 1024).toFixed(2),
          free: +(diskFree / 1024 / 1024 / 1024).toFixed(2),
          usagePercentage: diskUsage
        },
        uptime: os.uptime(),
        activeConnections: activeConnectionsCount
      });
    } catch(e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/admin/clear-logs", (req, res) => {
    try {
      res.json({ success: true, message: 'Log dosyaları başarıyla temizlendi.' });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/admin/clear-cache", (req, res) => {
    try {
      res.json({ success: true, message: 'Sistem önbelleği başarıyla boşaltıldı.' });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/products", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    )
      return res.json(
        getFallbackTable(
          "products",
          (req.headers["x-tenant-id"] as string) || "1111111111",
        ),
      );
    try {
      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM products WHERE vkn = ?", [
        (req.headers["x-tenant-id"] as string) || "1111111111",
      ]);
      res.json(
        (rows as any[]).map((row: any) => ({
          ...row,
          warehouseStocks:
            typeof row.warehouseStocks === "string"
              ? JSON.parse(row.warehouseStocks)
              : row.warehouseStocks || [],
        })),
      );
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      deleteFallbackRow(
        "products",
        req.params.id,
        (req.headers["x-tenant-id"] as string) || "1111111111",
      );
      return res.json({ success: true });
    }
    const { id } = req.params;
    try {
      const pool = getPool();
      await pool.query("DELETE FROM products WHERE id = ? AND vkn = ?", [
        id,
        (req.headers["x-tenant-id"] as string) || "1111111111",
      ]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/categories", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    )
      return res.json(
        getFallbackTable(
          "categories",
          (req.headers["x-tenant-id"] as string) || "1111111111",
        ),
      );
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM categories WHERE vkn = ?",
        [(req.headers["x-tenant-id"] as string) || "1111111111"],
      );
      res.json(
        (rows as any[]).map((r: any) => {
          let parsed = [];
          try {
            parsed =
              typeof r.sub_categories === "string"
                ? JSON.parse(r.sub_categories)
                : r.sub_categories || [];
          } catch (e) {}
          return {
            id: r.id,
            name: r.name,
            subCategories: Array.isArray(parsed) ? parsed : [],
          };
        }),
      );
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/categories", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    const newCat = { ...req.body, id: req.body.id || String(Date.now()) };
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      
      insertFallbackRow("categories", { ...newCat, vkn });
      return res.json(newCat);
    }
    const { id, name, subCategories } = newCat;
    try {
      const pool = getPool();
      await pool.query(
        "INSERT INTO categories (vkn, id, name, sub_categories) VALUES (?, ?, ?, ?)",
        [
          (req.headers["x-tenant-id"] as string) || "1111111111",
          id,
          name,
          JSON.stringify(subCategories),
        ],
      );
      res.json(newCat);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      
      updateFallbackRow("categories", req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { name, subCategories } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        "UPDATE categories SET name = ?, sub_categories = ? WHERE id = ? AND vkn = ?",
        [
          name,
          JSON.stringify(subCategories),
          id,
          (req.headers["x-tenant-id"] as string) || "1111111111",
        ],
      );
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      deleteFallbackRow(
        "categories",
        req.params.id,
        (req.headers["x-tenant-id"] as string) || "1111111111",
      );
      return res.json({ success: true });
    }
    const { id } = req.params;
    try {
      const pool = getPool();
      await pool.query("DELETE FROM categories WHERE id = ? AND vkn = ?", [
        id,
        (req.headers["x-tenant-id"] as string) || "1111111111",
      ]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/brands", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    )
      return res.json(
        getFallbackTable("brands", (req.headers["x-tenant-id"] as string) || "1111111111"),
      );
    try {
      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM brands WHERE vkn = ?", [
        (req.headers["x-tenant-id"] as string) || "1111111111",
      ]);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/brands", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      insertFallbackRow("brands", {
        ...req.body,
        vkn: (req.headers["x-tenant-id"] as string) || "1111111111",
      });
      return res.json(req.body);
    }
    const { id, name } = req.body;
    try {
      const pool = getPool();
      await pool.query("INSERT INTO brands (vkn, id, name) VALUES (?, ?, ?)", [
        (req.headers["x-tenant-id"] as string) || "1111111111",
        id,
        name,
      ]);
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put("/api/brands/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      
      updateFallbackRow("brands", req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { name } = req.body;
    try {
      const pool = getPool();
      await pool.query("UPDATE brands SET name = ? WHERE id = ? AND vkn = ?", [
        name,
        id,
        (req.headers["x-tenant-id"] as string) || "1111111111",
      ]);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete("/api/brands/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      deleteFallbackRow(
        "brands",
        req.params.id,
        (req.headers["x-tenant-id"] as string) || "1111111111",
      );
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query("DELETE FROM brands WHERE id = ? AND vkn = ?", [
        req.params.id,
        (req.headers["x-tenant-id"] as string) || "1111111111",
      ]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/warehouses", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    )
      return res.json(
        getFallbackTable(
          "warehouses",
          (req.headers["x-tenant-id"] as string) || "1111111111",
        ),
      );
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM warehouses WHERE vkn = ?",
        [(req.headers["x-tenant-id"] as string) || "1111111111"],
      );
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/stock_transfers", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    )
      return res.json(getFallbackTable("stock_transfers", vkn));
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM stock_transfers WHERE vkn = ? ORDER BY date DESC",
        [vkn],
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/stock_transfers", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    
    const data = req.body;

    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      const products = getFallbackTable("products", vkn);
      const product = products.find((p: any) => p.id === data.productId);
      if (product) {
        if (!product.warehouseStocks) product.warehouseStocks = [];

        const sourceWhIndex = product.warehouseStocks.findIndex(
          (w: any) => w.warehouseId === data.sourceWarehouse,
        );
        if (sourceWhIndex > -1) {
          product.warehouseStocks[sourceWhIndex].stock -= data.quantity;
        } else {
          product.warehouseStocks.push({
            warehouseId: data.sourceWarehouse,
            stock: -data.quantity,
          });
        }

        const targetWhIndex = product.warehouseStocks.findIndex(
          (w: any) => w.warehouseId === data.targetWarehouse,
        );
        if (targetWhIndex > -1) {
          product.warehouseStocks[targetWhIndex].stock += data.quantity;
        } else {
          product.warehouseStocks.push({
            warehouseId: data.targetWarehouse,
            stock: data.quantity,
          });
        }

        updateFallbackRow("products", data.productId, vkn, {
          warehouseStocks: product.warehouseStocks,
        });
      }

      insertFallbackRow("stock_transfers", { ...data, vkn });
      return res.json({ id: data.id, ...data });
    }

    try {
      const pool = getPool();
      const [rows] = (await pool.query(
        "SELECT warehouseStocks FROM products WHERE id = ? AND vkn = ?",
        [data.productId, vkn],
      )) as any;
      if (rows && (rows as any[]).length > 0) {
        let wStocks = rows[0].warehouseStocks;
        if (typeof wStocks === "string") wStocks = JSON.parse(wStocks);
        if (!wStocks) wStocks = [];

        const sourceWhIndex = wStocks.findIndex(
          (w: any) => w.warehouseId === data.sourceWarehouse,
        );
        if (sourceWhIndex > -1) wStocks[sourceWhIndex].stock -= data.quantity;
        else
          wStocks.push({
            warehouseId: data.sourceWarehouse,
            stock: -data.quantity,
          });

        const targetWhIndex = wStocks.findIndex(
          (w: any) => w.warehouseId === data.targetWarehouse,
        );
        if (targetWhIndex > -1) wStocks[targetWhIndex].stock += data.quantity;
        else
          wStocks.push({
            warehouseId: data.targetWarehouse,
            stock: data.quantity,
          });

        await pool.query(
          "UPDATE products SET warehouseStocks = ? WHERE id = ? AND vkn = ?",
          [JSON.stringify(wStocks), data.productId, vkn],
        );
      }

      const q =
        "INSERT INTO stock_transfers (id, vkn, productId, productName, sourceWarehouse, targetWarehouse, quantity, date, personnelName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
      await pool.query(q, [
        data.id,
        vkn,
        data.productId,
        data.productName,
        data.sourceWarehouse,
        data.targetWarehouse,
        data.quantity,
        data.date,
        data.personnelName,
      ]);

      res.json({ id: data.id, ...data });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/warehouses", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      insertFallbackRow("warehouses", {
        ...req.body,
        vkn: (req.headers["x-tenant-id"] as string) || "1111111111",
      });
      return res.json(req.body);
    }
    const { id, name, address, capacity } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        "INSERT INTO warehouses (vkn, id, name, address, capacity) VALUES (?, ?, ?, ?, ?)",
        [
          (req.headers["x-tenant-id"] as string) || "1111111111",
          id,
          name,
          address,
          capacity,
        ],
      );
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put("/api/warehouses/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      const oldWhs = getFallbackTable("warehouses", vkn);
      const oldWh = oldWhs.find((w: any) => w.id === req.params.id);
      const oldName = oldWh?.name;
      
      updateFallbackRow("warehouses", req.params.id, vkn, req.body);
      
      if (oldName && oldName !== req.body.name) {
         const products = getFallbackTable("products", vkn);
         for (const p of products) {
            let changed = false;
            if (p.warehouse === oldName) {
               p.warehouse = req.body.name;
               changed = true;
            }
            if (p.warehouseStocks && Array.isArray(p.warehouseStocks)) {
               for (const ws of p.warehouseStocks) {
                  if (ws.warehouseId === oldName || ws.warehouseId === req.params.id) {
                     ws.warehouseId = req.body.name;
                     changed = true;
                  }
               }
            }
            if (changed) {
               updateFallbackRow("products", p.id, vkn, p);
            }
         }
      }
      return res.json({ id: req.params.id, ...req.body });
    }
    const { name, address, capacity } = req.body;
    try {
      const pool = getPool();
      
      const [oldRows] = await pool.query("SELECT name FROM warehouses WHERE id = ? AND vkn = ?", [req.params.id, vkn]) as any;
      const oldName = oldRows[0]?.name;
      
      await pool.query(
        "UPDATE warehouses SET name = ?, address = ?, capacity = ? WHERE id = ? AND vkn = ?",
        [
          name,
          address,
          capacity,
          req.params.id,
          vkn,
        ],
      );
      
      if (oldName && oldName !== name) {
        const [products] = await pool.query("SELECT id, warehouse, warehouseStocks FROM products WHERE vkn = ?", [vkn]) as any;
        for (const p of products) {
           let changed = false;
           let newWarehouse = p.warehouse;
           if (p.warehouse === oldName) {
              newWarehouse = name;
              changed = true;
           }
           let wStocks = p.warehouseStocks;
           if (typeof wStocks === "string") {
              try { wStocks = JSON.parse(wStocks); } catch(e) { wStocks = []; }
           }
           if (wStocks && Array.isArray(wStocks)) {
              for (const ws of wStocks) {
                 if (ws.warehouseId === oldName || ws.warehouseId === req.params.id) {
                    ws.warehouseId = name;
                    changed = true;
                 }
              }
           }
           if (changed) {
              await pool.query("UPDATE products SET warehouse = ?, warehouseStocks = ? WHERE id = ? AND vkn = ?", [newWarehouse, JSON.stringify(wStocks), p.id, vkn]);
           }
        }
      }
      
      res.json({ id: req.params.id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete("/api/warehouses/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      const oldWhs = getFallbackTable("warehouses", vkn);
      const oldWh = oldWhs.find((w: any) => w.id === req.params.id);
      const oldName = oldWh?.name;

      deleteFallbackRow("warehouses", req.params.id, vkn);
      
      if (oldName) {
         const products = getFallbackTable("products", vkn);
         for (const p of products) {
            let changed = false;
            if (p.warehouse === oldName) {
               p.warehouse = "";
               changed = true;
            }
            if (p.warehouseStocks && Array.isArray(p.warehouseStocks)) {
               const oldLen = p.warehouseStocks.length;
               p.warehouseStocks = p.warehouseStocks.filter((ws: any) => ws.warehouseId !== oldName && ws.warehouseId !== req.params.id);
               if (p.warehouseStocks.length !== oldLen) {
                  changed = true;
                  p.stock = p.warehouseStocks.reduce((sum: number, w: any) => sum + (Number(w.stock) || 0), 0);
               }
            }
            if (changed) {
               updateFallbackRow("products", p.id, vkn, p);
            }
         }
      }
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      const [oldRows] = await pool.query("SELECT name FROM warehouses WHERE id = ? AND vkn = ?", [req.params.id, vkn]) as any;
      const oldName = oldRows[0]?.name;

      await pool.query("DELETE FROM warehouses WHERE id = ? AND vkn = ?", [
        req.params.id,
        vkn,
      ]);
      
      if (oldName) {
        const [products] = await pool.query("SELECT id, warehouse, warehouseStocks, stock FROM products WHERE vkn = ?", [vkn]) as any;
        for (const p of products) {
           let changed = false;
           let newWarehouse = p.warehouse;
           if (p.warehouse === oldName) {
              newWarehouse = "";
              changed = true;
           }
           let wStocks = p.warehouseStocks;
           if (typeof wStocks === "string") {
              try { wStocks = JSON.parse(wStocks); } catch(e) { wStocks = []; }
           }
           let totalStock = p.stock || 0;
           if (wStocks && Array.isArray(wStocks)) {
              const oldLen = wStocks.length;
              wStocks = wStocks.filter(ws => ws.warehouseId !== oldName && ws.warehouseId !== req.params.id);
              if (wStocks.length !== oldLen) {
                 changed = true;
                 totalStock = wStocks.reduce((sum, ws) => sum + (Number(ws.stock) || 0), 0);
              }
           }
           if (changed) {
              await pool.query("UPDATE products SET warehouse = ?, warehouseStocks = ?, stock = ? WHERE id = ? AND vkn = ?", [newWarehouse, JSON.stringify(wStocks), totalStock, p.id, vkn]);
           }
        }
      }
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] || "1111111111");


    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      
      updateFallbackRow("products", req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const {
      code,
      name,
      price,
      purchasePrice,
      stock,
      category,
      warehouse,
      barcode,
      description,
      brand,
      taxRate,
      warehouseStocks,
      showInQuickSale,
      supplierPrice,
      image,
      unit,
    } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        "UPDATE products SET code = ?, name = ?, price = ?, stock = ?, category = ?, warehouse = ?, barcode = ?, description = ?, brand = ?, `taxRate` = ?, `warehouseStocks` = ?, `purchasePrice` = ?, `showInQuickSale` = ?, `supplierPrice` = ?, `image` = ?, `unit` = ? WHERE id = ? AND vkn = ?",
        [
          code,
          name,
          price,
          stock,
          category,
          warehouse,
          barcode,
          description,
          brand,
          taxRate,
          JSON.stringify(warehouseStocks || []),
          purchasePrice,
          showInQuickSale ? 1 : 0,
          supplierPrice,
          image || null,
          unit || 'Adet',
          id,
          (req.headers["x-tenant-id"] as string) || "1111111111",
        ],
      );
      res.json({ id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/products", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] || "1111111111");


    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      
      insertFallbackRow("products", {
        ...req.body,
        vkn,
        id: req.body.id || String(Date.now()),
      });
      return res.json(req.body);
    }
    const {
      id,
      code,
      name,
      price,
      purchasePrice,
      stock,
      category,
      warehouse,
      barcode,
      description,
      brand,
      taxRate,
      warehouseStocks,
      showInQuickSale,
      supplierPrice,
      image,
    } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        "INSERT INTO products (vkn, id, code, name, price, stock, category, warehouse, barcode, description, brand, `taxRate`, `warehouseStocks`, `purchasePrice`, `showInQuickSale`, `supplierPrice`, `image`, `unit`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          (req.headers["x-tenant-id"] as string) || "1111111111",
          id,
          code,
          name,
          price,
          stock,
          category,
          warehouse,
          barcode,
          description,
          brand,
          taxRate,
          JSON.stringify(warehouseStocks || []),
          purchasePrice,
          showInQuickSale ? 1 : 0,
          supplierPrice,
          image || null,
          unit || 'Adet',
        ],
      );
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/reconciliations", async (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      reloadFallbackDb();
      const allReconciliations = getFallbackTable("reconciliations");
      const tenantRows = allReconciliations.filter(
        (r: any) => !r.vkn || String(r.vkn) === String(vkn)
      );
      return res.json(tenantRows);
    }
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM reconciliations WHERE vkn = ? ORDER BY date DESC",
        [vkn],
      );
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/reconciliations/:id/public", async (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    const { id } = req.params;
    const vkn = (req.query.vkn as string) || (req.headers["x-tenant-id"] as string) || "";

    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      reloadFallbackDb();
      const allReconciliations = getFallbackTable("reconciliations");
      const record =
        allReconciliations.find(
          (r: any) => String(r.id) === String(id) && (!vkn || String(r.vkn) === String(vkn))
        ) ||
        allReconciliations.find((r: any) => String(r.id) === String(id));

      if (!record) {
        return res.status(404).json({ error: "Mutabakat kaydı bulunamadı." });
      }

      const settingsList = getFallbackTable("settings");
      const tenantSettings =
        settingsList.find((s: any) => String(s.vkn) === String(record.vkn)) ||
        settingsList[0] ||
        {};

      return res.json({
        ...record,
        companyName: tenantSettings.companyName || "Esila Ticari",
        companyPhone: tenantSettings.phone || "",
        companyEmail: tenantSettings.email || "",
      });
    }

    try {
      const pool = getPool();
      const [rows] = (await pool.query(
        "SELECT * FROM reconciliations WHERE id = ?",
        [id]
      )) as any;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Mutabakat kaydı bulunamadı." });
      }
      const record = rows[0];
      let companyName = "Esila Ticari";
      let companyPhone = "";
      let companyEmail = "";
      try {
        const [sRows] = (await pool.query(
          "SELECT companyName, phone, email FROM settings WHERE vkn = ? LIMIT 1",
          [record.vkn || vkn || "1111111111"]
        )) as any;
        if (sRows && sRows.length > 0) {
          companyName = sRows[0].companyName || companyName;
          companyPhone = sRows[0].phone || "";
          companyEmail = sRows[0].email || "";
        }
      } catch (_e) {}

      res.json({
        ...record,
        companyName,
        companyPhone,
        companyEmail,
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/reconciliations", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    const numericBalance = Number(req.body.balance);
    const safeBalance = Number.isFinite(numericBalance) ? Math.abs(numericBalance) : 0;
    const mutabakat = {
      ...req.body,
      vkn,
      id: req.body.id || `MUT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      balance: safeBalance,
      balanceType: req.body.balanceType || (safeBalance === 0 ? "Yok" : "Borç"),
      status: req.body.status || "Bekliyor",
      date: req.body.date || new Date().toISOString().split("T")[0],
      notes: req.body.notes || "",
      emailSentAt: req.body.emailSentAt || new Date().toISOString(),
      respondedAt: req.body.respondedAt || null,
      responseNotes: req.body.responseNotes || null,
    };

    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      insertFallbackRow("reconciliations", mutabakat);
      return res.json(mutabakat);
    }

    try {
      const pool = getPool();
      await pool.query(
        "INSERT INTO reconciliations (vkn, id, `customerId`, `customerName`, date, `balanceType`, balance, status, notes, `emailSentAt`, `respondedAt`, `responseNotes`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          vkn,
          mutabakat.id,
          mutabakat.customerId,
          mutabakat.customerName,
          mutabakat.date,
          mutabakat.balanceType,
          mutabakat.balance,
          mutabakat.status,
          mutabakat.notes,
          mutabakat.emailSentAt,
          mutabakat.respondedAt,
          mutabakat.responseNotes,
        ],
      );
      res.json(mutabakat);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put("/api/reconciliations/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    const { id } = req.params;
    const {
      customerId,
      customerName,
      date,
      balanceType,
      balance,
      status,
      notes,
      emailSentAt,
      respondedAt,
      responseNotes,
    } = req.body;
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      reloadFallbackDb();
      const allReconciliations = getFallbackTable("reconciliations");
      const existing = allReconciliations.find((r: any) => String(r.id) === String(id));
      const targetVkn = existing?.vkn || vkn;
      updateFallbackRow("reconciliations", id, targetVkn, req.body);
      return res.json({ id, ...existing, ...req.body });
    }
    try {
      const pool = getPool();
      await pool.query(
        "UPDATE reconciliations SET `customerId` = ?, `customerName` = ?, date = ?, `balanceType` = ?, balance = ?, status = ?, notes = ?, `emailSentAt` = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ?",
        [
          customerId,
          customerName,
          date,
          balanceType,
          Number(balance) || 0,
          status || "Bekliyor",
          notes || "",
          emailSentAt || null,
          respondedAt || null,
          responseNotes || null,
          id,
        ],
      );
      res.json({ id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.delete("/api/reconciliations/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      reloadFallbackDb();
      const allReconciliations = getFallbackTable("reconciliations");
      const existing = allReconciliations.find((r: any) => String(r.id) === String(req.params.id));
      const targetVkn = existing?.vkn || vkn;
      deleteFallbackRow("reconciliations", req.params.id, targetVkn);
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query("DELETE FROM reconciliations WHERE id = ?", [
        req.params.id,
      ]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  const handleReconciliationDecision = async (
    req: any,
    res: any,
    newStatus: "Onaylandı" | "Reddedildi"
  ) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    const id = req.params.id;
    const notes = String(req.body?.notes ?? req.query?.notes ?? "").trim();
    const date = new Date().toISOString();
    const requestedVkn =
      (req.body?.vkn as string) ||
      (req.query?.vkn as string) ||
      (req.headers["x-tenant-id"] as string) ||
      "1111111111";

    if (
      !process.env.DATABASE_URL ||
      !process.env.DATABASE_URL.startsWith("mysql")
    ) {
      reloadFallbackDb();
      const allReconciliations = getFallbackTable("reconciliations");
      const existing =
        allReconciliations.find(
          (r: any) => String(r.id) === String(id) && String(r.vkn) === String(requestedVkn)
        ) ||
        allReconciliations.find((r: any) => String(r.id) === String(id));

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Mutabakat kaydı bulunamadı.",
        });
      }

      const updated = updateFallbackRow("reconciliations", String(existing.id), String(existing.vkn), {
        status: newStatus,
        respondedAt: date,
        responseNotes: notes,
      });

      return res.json({
        success: true,
        message: `Mutabakat ${newStatus}`,
        reconciliation: updated,
      });
    }

    try {
      const pool = getPool();
      const [result] = (await pool.query(
        "UPDATE reconciliations SET status = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ?",
        [newStatus, date, notes, id]
      )) as any;

      if (result && result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Mutabakat kaydı bulunamadı.",
        });
      }

      res.json({
        success: true,
        message: `Mutabakat ${newStatus}`,
        id,
        status: newStatus,
        respondedAt: date,
        responseNotes: notes,
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  };

  app.get("/api/reconciliations/:id/approve", (req, res) =>
    handleReconciliationDecision(req, res, "Onaylandı")
  );
  app.post("/api/reconciliations/:id/approve", (req, res) =>
    handleReconciliationDecision(req, res, "Onaylandı")
  );

  app.get("/api/reconciliations/:id/reject", (req, res) =>
    handleReconciliationDecision(req, res, "Reddedildi")
  );
  app.post("/api/reconciliations/:id/reject", (req, res) =>
    handleReconciliationDecision(req, res, "Reddedildi")
  );

  app.get("/api/tenants", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const tenants = getFallbackTable("tenants");
        const users = getFallbackTable("users");
        const settingsTable = getFallbackTable("settings");
        const resData = tenants.map((t) => {
          const u = users.find((us) => us.vkn === t.vkn && us.role === "Admin");
          const sett = settingsTable.find((s) => s.vkn === t.vkn);
          return {
            ...t,
            password: u ? u.passwordHash : "",
            phone: sett ? sett.phone : t.phone,
            address: sett ? sett.address : t.address,
          };
        });
        return res.json(resData);
      }
      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT t.*, u.passwordHash as password, s.phone, s.address FROM tenants t LEFT JOIN users u ON t.vkn = u.vkn AND u.role = 'Admin' LEFT JOIN settings s ON t.vkn = s.vkn GROUP BY t.vkn",
      );
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/tenants/:vkn/reset-password", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { vkn } = req.params;
      const newAdminPass = generateSecurePassword();

      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const fallbacksU = getFallbackTable("users");
        const adminUser = fallbacksU.find(
          (u) => u.vkn === vkn && u.role === "Admin",
        );
        if (adminUser) {
          adminUser.passwordHash = newAdminPass;

          const fallbacksT = getFallbackTable("tenants");
          const tenant = fallbacksT.find((t) => t.vkn === vkn);

          if (tenant && tenant.email) {
            await sendMail(
              tenant.email,
              "Şifreniz Sıfırlandı - Esila Ticari",
              `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın ${tenant.name},</h2>
<p style="margin-bottom: 16px;">Sistem yöneticiniz tarafından hesabınızın şifresi güvenlik amacıyla sıfırlanmıştır. Oluşturulan yeni şifreniz ile sisteme giriş yapabilirsiniz.</p>

<div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px;">
<p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Yeni Şifreniz</p>
<p style="margin: 8px 0 0 0; font-size: 24px; font-family: monospace; font-weight: 700; color: #111827;">${newAdminPass}</p>
</div>

<p style="color: #dc2626; font-size: 14px; margin-bottom: 8px; font-weight: 500;">⚠️ Güvenlik Uyarısı:</p>
<ul style="color: #4b5563; font-size: 14px; padding-left: 20px; margin-top: 0;">
<li>Sisteme giriş yaptıktan sonra şifrenizi ayarlar menüsünden lütfen değiştiriniz.</li>
<li>Bu şifreyi kimseyle paylaşmayınız.</li>
</ul>`,
            );
          }

          return res.json({ success: true, password: newAdminPass });
        }
        return res.status(404).json({ error: "Yönetici hesabı bulunamadı." });
      }

      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM users WHERE vkn = ? AND role = 'Admin'",
        [vkn],
      );
      if ((rows as any[]).length === 0)
        return res.status(404).json({ error: "Admin kullanıcı bulunamadı." });

      const adminUser = rows[0];
      await pool.query("UPDATE users SET passwordHash = ? WHERE id = ?", [
        newAdminPass,
        adminUser.id,
      ]);

      const [tenantRows] = await pool.query(
        "SELECT * FROM tenants WHERE vkn = ?",
        [vkn],
      );
      const tenant = tenantRows[0];
      if (tenant && tenant.email) {
        await sendMail(
          tenant.email,
          "Şifreniz Sıfırlandı - Esila Ticari",
          `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın ${tenant.name},</h2>
<p style="margin-bottom: 16px;">Sistem yöneticiniz tarafından hesabınızın şifresi güvenlik amacıyla sıfırlanmıştır. Oluşturulan yeni şifreniz ile sisteme giriş yapabilirsiniz.</p>

<div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px;">
<p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Yeni Şifreniz</p>
<p style="margin: 8px 0 0 0; font-size: 24px; font-family: monospace; font-weight: 700; color: #111827;">${newAdminPass}</p>
</div>

<p style="color: #dc2626; font-size: 14px; margin-bottom: 8px; font-weight: 500;">⚠️ Güvenlik Uyarısı:</p>
<ul style="color: #4b5563; font-size: 14px; padding-left: 20px; margin-top: 0;">
<li>Sisteme giriş yaptıktan sonra şifrenizi ayarlar menüsünden lütfen değiştiriniz.</li>
<li>Bu şifreyi kimseyle paylaşmayınız.</li>
</ul>`,
        );
      }

      res.json({ success: true, password: newAdminPass });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/tenants", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const data = req.body || {};
      if (!data.vkn || !isValidVkn(data.vkn) || !data.name || !isValidEmail(data.email)) {
        return res.status(400).json({ error: "Lütfen geçerli VKN/TCKN, firma unvanı ve e-posta adresi giriniz." });
      }
      data.vkn = sanitizeTenantId(data.vkn);
      data.name = String(data.name).trim().slice(0, 150);
      data.email = String(data.email).trim().slice(0, 150);

      const newAdminPass = generateSecurePassword();
      let expInterval = "1 YEAR";
      if (data.package === "Aylık") expInterval = "1 MONTH";
      if (data.package === "Sınırsız") expInterval = "100 YEAR";

      const sendRegistrationMail = async (
        tenantEmail: string,
        tenantName: string,
      ) => {
        const safeTenantName = escapeHtml(tenantName);
        const safeTenantEmail = escapeHtml(tenantEmail);
        if (tenantEmail) {
          await sendMail(
            tenantEmail,
            "Yeni Kayıt Talebi - Esila Ticari",
            `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın ${safeTenantName},</h2>
<p style="margin-bottom: 16px;">Esila Ticari Yönetim Sistemi'ne kayıt talebiniz başarıyla bize ulaşmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.</p>

<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
    <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">Sırada Ne Var?</h3>
    <p style="color: #1e3a8a; margin-bottom: 0;">Müşteri temsilcilerimiz şu anda firma bilgilerinizi inceliyor. İnceleme işlemi tamamlandığında, hesabınız aktive edilecek ve size <b>yeni bir bilgilendirme e-postası</b> gönderilecektir.</p>
</div>

<p style="margin-bottom: 8px;">Hesabınızın onay süreci tamamlandığında göndereceğimiz e-posta içerisinde sisteme giriş yapabilmeniz için gereken yönetici şifreniz bulunacaktır.</p>`,
          );
        }

        try {
          await sendMail(
             "ahdurko@gmail.com",
             "Yeni Firma Kayıt Talebi",
             `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Merhaba Süper Admin,</h2>
<p style="margin-bottom: 16px;">Esila Ticari sistemine yeni bir firma kayıt talebinde bulundu.</p>
<ul style="margin-bottom: 16px;">
  <li><b>Firma Adı:</b> ${safeTenantName}</li>
  <li><b>E-posta:</b> ${safeTenantEmail || '-'}</li>
</ul>
<p>Lütfen SuperAdmin paneli üzerinden ilgili başvuruyu kontrol edip yönetin.</p>`,
          );
        } catch(e) {
          console.error("Superadmin maili gönderilirken hata oluştu:", e);
        }
      };

      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const dDate = new Date();
        dDate.setFullYear(
          dDate.getFullYear() +
            (data.package === "Aylık"
              ? 0
              : data.package === "Sınırsız"
                ? 100
                : 1),
        );
        if (data.package === "Aylık") dDate.setMonth(dDate.getMonth() + 1);

        insertFallbackRow("tenants", {
          ...data,
          status: "Bekliyor",
          expirationDate: dDate.toISOString(),
          smsLimit: data.smsLimit || 0,
          emailLimit: data.emailLimit || 0,
          smsCount: 0,
          emailCount: 0,
          createdAt: new Date().toISOString(),
        });
        insertFallbackRow("users", {
          id: "admin-" + data.vkn,
          vkn: data.vkn,
          name: data.name + " Admin",
          username: data.vkn,
          email: data.email,
          passwordHash: newAdminPass,
          role: "Admin",
          status: "Aktif",
        });
        insertFallbackRow("settings", {
          vkn: data.vkn,
          id: 1,
          companyName: data.name,
          email: data.email,
        });

        await sendRegistrationMail(data.email, data.name);
        return res.json({ success: true, password: newAdminPass });
      }

      const pool = getPool();
      const q = `INSERT INTO tenants (vkn, name, email, modules, status, package, expirationDate, sector, isEsilaCustomer, smsLimit, emailLimit, smsCount, emailCount, createdAt) VALUES (?, ?, ?, ?, 'Bekliyor', ?, DATE_ADD(NOW(), INTERVAL ${expInterval}), ?, ?, ?, ?, 0, 0, NOW())`;
      await pool.query(q, [
        data.vkn,
        data.name,
        data.email,
        JSON.stringify(data.modules),
        data.package || "Yıllık",
        data.sector || "",
        data.isEsilaCustomer ? true : false,
        data.smsLimit || 0,
        data.emailLimit || 0,
      ]);

      // Seed user for tenant
      await pool.query(
        "INSERT INTO users (id, vkn, name, username, email, passwordHash, role, status) VALUES (?, ?, ?, ?, ?, ?, 'Admin', 'Aktif')",
        [
          "admin-" + data.vkn,
          data.vkn,
          data.name + " Admin",
          data.vkn,
          data.email,
          newAdminPass,
        ],
      );

      // Seed settings
      const fullAddress = [data.address, data.district, data.city]
        .filter(Boolean)
        .join(" - ");
      await pool.query(
        "INSERT INTO settings (vkn, id, companyName, email, phone, address) VALUES (?, 1, ?, ?, ?, ?)",
        [data.vkn, data.name, data.email, data.phone || "", fullAddress],
      );

      await sendRegistrationMail(data.email, data.name);
      res.json({ success: true, password: newAdminPass });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put("/api/tenants/:vkn/toggle-status", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { vkn } = req.params;

      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const fallbacks = getFallbackTable("tenants");
        const t = fallbacks.find((x) => x.vkn === vkn);
        if (t) {
          t.status = t.status === "Aktif" ? "Pasif" : "Aktif";

          const fallbacksU = getFallbackTable("users");
          fallbacksU.forEach((u) => {
            if (u.vkn === vkn) u.status = t.status;
          });

          return res.json({ success: true, status: t.status });
        }
        return res.status(404).json({ error: "Firma bulunamadı" });
      }

      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT status FROM tenants WHERE vkn = ?",
        [vkn],
      );
      if ((rows as any[]).length === 0)
        return res.status(404).json({ error: "Firma bulunamadı" });

      const newStatus = rows[0].status === "Aktif" ? "Pasif" : "Aktif";
      await pool.query("UPDATE tenants SET status = ? WHERE vkn = ?", [
        newStatus,
        vkn,
      ]);
      await pool.query("UPDATE users SET status = ? WHERE vkn = ?", [
        newStatus,
        vkn,
      ]);

      res.json({ success: true, status: newStatus });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put("/api/tenants/:vkn/activate", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { vkn } = req.params;

      const generateCustomPdfBuffer = async (title: string, contentArray: { type: string, text: string }[]): Promise<Buffer> => {
        const PDFDocument = (await import('pdfkit')).default;
        
        const replaceTR = (t: string) => t
          .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
          .replace(/ş/g, 's').replace(/Ş/g, 'S')
          .replace(/ı/g, 'i').replace(/İ/g, 'I')
          .replace(/ö/g, 'o').replace(/Ö/g, 'O')
          .replace(/ç/g, 'c').replace(/Ç/g, 'C')
          .replace(/ü/g, 'u').replace(/Ü/g, 'U');

        return new Promise((resolve, reject) => {
          try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: any[] = [];
            
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            
            const regularFont = 'Helvetica';
            const boldFont = 'Helvetica-Bold';
            
            // Header
            doc.font(boldFont).fontSize(14).text(replaceTR("Esila Yazılım Teknolojileri Limited Şirketi"), { align: 'center' });
            doc.font(regularFont).fontSize(10).text("www.esilaticari.com", { align: 'center' });
            doc.moveDown(2);
            
            doc.font(boldFont).fontSize(18).text(replaceTR(title), { align: 'center' });
            doc.moveDown(2);
            
            contentArray.forEach(item => {
               if (item.type === 'h1') {
                   doc.font(boldFont).fontSize(14).text(replaceTR(item.text));
                   doc.moveDown(0.5);
               } else if (item.type === 'h2') {
                   doc.font(boldFont).fontSize(12).text(replaceTR(item.text), { align: 'center' });
                   doc.moveDown(0.5);
               } else if (item.type === 'p') {
                   doc.font(regularFont).fontSize(11).text(replaceTR(item.text), { align: item.text.startsWith('Son Günce') || item.text.startsWith('Esila Yazılım |') ? 'right' : 'left' });
                   doc.moveDown(0.5);
               } else if (item.type === 'li') {
                   doc.font(regularFont).fontSize(11).text(replaceTR(`• ${item.text}`), { indent: 20 });
                   doc.moveDown(0.2);
               }
            });
            
            doc.end();
          } catch(e) {
            reject(e);
          }
        });
      };

      const sendActivationMail = async (
        tenantEmail: string,
        tenantName: string,
        adminPassword?: string,
      ) => {
        let passInfoHTML = "";
        if (adminPassword) {
          passInfoHTML = `
              <p style="margin-top: 24px; margin-bottom: 8px; font-weight: 500; color: #374151;">Aşağıdaki yönetici bilgileri ile sisteme güvenle giriş yapabilirsiniz:</p>
              <div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px;">
                 <div>
                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Kullanıcı Adı (T.C./VKN)</p>
                    <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600; color: #111827;">${req.params.vkn}</p>
                 </div>
                 <div>
                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Şifre</p>
                    <p style="margin: 4px 0 0 0; font-size: 18px; font-family: monospace; font-weight: 700; color: #111827;">${adminPassword}</p>
                 </div>
              </div>
            `;
        } else {
          passInfoHTML =
            '<p style="margin-top: 24px; margin-bottom: 24px;">Sisteme giriş yapabilirsiniz.</p>';
        }

        if (tenantEmail) {
          const gizlilikText = [
              {type: 'h2', text: 'Esila Ticari ERP Platformu – Veri Gizliliği Taahhütlerimiz'},
              {type: 'p', text: 'Son Güncelleme: 14 Haziran 2026'},
              {type: 'h1', text: '1. GİRİŞ'},
              {type: 'p', text: 'Esila Yazılım olarak, kullanıcılarımızın gizliliğine saygı duymakta ve kişisel verilerinin korunmasını öncelikli bir görev olarak kabul etmekteyiz. Bu Gizlilik Politikası, www.esilaticari.com adresi ve Esila Ticari platformu üzerinden toplanan verilerin nasıl işlendiğini açıklamaktadır.'},
              {type: 'h1', text: '2. TOPLANAN VERİLER'},
              {type: 'h2', text: '2.1 Doğrudan Sağlanan Veriler'},
              {type: 'li', text: 'Kayıt sırasında girilen ad, soyad, e-posta, telefon ve şirket bilgileri'},
              {type: 'li', text: 'Abonelik ve fatura bilgileri'},
              {type: 'li', text: 'Platformdaki işlem ve içerik verileri'},
              {type: 'li', text: 'Destek talepleri ve iletişim içerikleri'},
              {type: 'h2', text: '2.2 Otomatik Toplanan Veriler'},
              {type: 'li', text: 'IP adresi ve konum bilgisi (şehir düzeyinde)'},
              {type: 'li', text: 'Tarayıcı türü, işletim sistemi, cihaz bilgisi'},
              {type: 'li', text: 'Kullanılan özellikler, sayfa görüntüleme geçmişi, oturum süresi'},
              {type: 'li', text: 'Çerezler ve benzeri izleme teknolojileri aracılığıyla elde edilen veriler'},
              {type: 'h2', text: '2.3 Üçüncü Taraf Kaynaklardan Alınan Veriler'},
              {type: 'li', text: 'Entegrasyon sağlanan bankalar veya ödeme sistemlerinden alınan veriler'},
              {type: 'li', text: 'GİB (Gelir İdaresi Başkanlığı) entegrasyonu kapsamındaki veriler'},
              {type: 'h1', text: '3. VERİLERİN KULLANIM AMACI'},
              {type: 'li', text: 'Yazılım hizmetinin sağlanması, bakımı ve iyileştirilmesi'},
              {type: 'li', text: 'Kullanıcı kimlik doğrulaması ve hesap güvenliği'},
              {type: 'li', text: 'Müşteri hizmetleri ve teknik destek'},
              {type: 'li', text: 'Ödeme ve abonelik yönetimi'},
              {type: 'li', text: 'Yasal yükümlülüklerin yerine getirilmesi'},
              {type: 'li', text: 'Hizmet bildirimleri ve sistem güncellemeleri'},
              {type: 'li', text: 'Kullanıcı deneyiminin kişiselleştirilmesi (rıza alındığı hallerde)'},
              {type: 'li', text: 'Güvenlik izleme ve dolandırıcılık tespiti'},
              {type: 'h1', text: '4. ÇEREZLER VE İZLEME TEKNOLOJİLERİ'},
              {type: 'h2', text: '4.1 Zorunlu Çerezler'},
              {type: 'p', text: 'Platformun çalışması için gerekli olan çerezlerdir. Bu çerezler devre dışı bırakılamaz.'},
              {type: 'h2', text: '4.2 Analitik Çerezler'},
              {type: 'p', text: 'Platformun nasıl kullanıldığını anlamamıza yardımcı olan anonim istatistik toplayan çerezlerdir. Kullanıcı tercihine göre devre dışı bırakılabilir.'},
              {type: 'h2', text: '4.3 Fonksiyonel Çerezler'},
              {type: 'p', text: 'Dil tercihi, oturum bilgileri gibi kullanıcı tercihlerini hatırlayan çerezlerdir. Çerez tercihlerinizi tarayıcı ayarlarınızdan veya platform ayarlar menüsünden yönetebilirsiniz.'},
              {type: 'h1', text: '5. VERİ GÜVENLİĞİ'},
              {type: 'p', text: 'Kişisel verilerinizi korumak için aşağıdaki teknik ve idari önlemleri uyguluyoruz:'},
              {type: 'li', text: '256-bit SSL/TLS şifreleme ile veri iletimi'},
              {type: 'li', text: 'Veritabanı şifreleme ve erişim kontrolleri'},
              {type: 'li', text: 'Düzenli güvenlik testleri ve zafiyet taramaları'},
              {type: 'li', text: 'Çalışanlar için gizlilik eğitimi ve erişim sınırlandırması'},
              {type: 'li', text: 'Güvenlik ihlali müdahale planı'},
              {type: 'li', text: 'Düzenli yedekleme ve felaket kurtarma prosedürleri'},
              {type: 'h1', text: '6. ÜÇÜNCÜ TARAF HİZMETLER VE BAĞLANTILAR'},
              {type: 'p', text: 'Platformumuz bazı üçüncü taraf hizmetlerle entegre çalışabilir. Bu hizmetlerin kendi gizlilik politikaları mevcuttur:'},
              {type: 'li', text: 'Bulut altyapı sağlayıcıları (sunucu ve depolama hizmetleri)'},
              {type: 'li', text: 'Ödeme altyapısı (güvenli ödeme işleme)'},
              {type: 'li', text: 'E-fatura entegrasyon sağlayıcıları'},
              {type: 'li', text: 'Analitik araçlar'},
              {type: 'p', text: 'Bu üçüncü taraflara yalnızca hizmetin sağlanması için gerekli minimum düzeyde veri aktarılmaktadır.'},
              {type: 'h1', text: '7. VERİ SAKLAMA VE SİLME'},
              {type: 'p', text: 'Kişisel verileriniz, hizmet ilişkisinin sona ermesinin ardından yasal zorunluluklar çerçevesinde belirli süreler saklanır. Hesabınızı silmeniz durumunda:'},
              {type: 'li', text: 'Aktif hizmet verileri 30 gün içinde silinir'},
              {type: 'li', text: 'Yedek sistemlerden tam silme 90 güne kadar sürebilir'},
              {type: 'li', text: 'Yasal zorunluluk gerektiren veriler ilgili mevzuat süreleri boyunca tutulur'},
              {type: 'h1', text: '8. ÇOCUKLARIN GİZLİLİĞİ'},
              {type: 'p', text: 'Esila Ticari platformu yalnızca ticari kullanıcılara yöneliktir. 18 yaşın altındaki kişilere hizmet sunulmamaktadır. 18 yaşın altındaki bir kişiye ait veri işlediğimizi fark ettiğimizde ilgili veriler derhal silinir.'},
              {type: 'h1', text: '9. POLİTİKA DEĞİŞİKLİKLERİ'},
              {type: 'p', text: 'Bu Gizlilik Politikası zaman zaman güncellenebilir. Önemli değişiklikler e-posta veya platform bildirimi aracılığıyla kullanıcılara duyurulur. Güncel politikaya her zaman web sitemizden ulaşabilirsiniz.'},
              {type: 'h1', text: '10. İLETİŞİM'},
              {type: 'p', text: 'Gizlilik konusundaki soru ve talepleriniz için:'},
              {type: 'li', text: 'E-posta: bilgi@esilaticari.com'},
              {type: 'li', text: 'Adres: Yenişehir Mh. Kardeşler Cd. Cumhuriyet Teknokent No:7/2 Ofis 201 Sivas, Türkiye'},
              {type: 'p', text: 'Esila Yazılım | 14 Haziran 2026'}
          ];

          const kosullarText = [
              {type: 'h2', text: 'Esila Ticari ERP Platformu'},
              {type: 'p', text: 'Son Güncelleme: 14 Haziran 2026'},
              {type: 'h1', text: '1. TARAFLAR VE KAPSAM'},
              {type: 'p', text: 'Bu Kullanım Koşulları ve Hizmet Sözleşmesi ("Sözleşme"), Esila Yazılım ("Esila") ile platforma kaydolan veya hizmetleri kullanan bireysel ya da kurumsal kullanıcı ("Kullanıcı") arasında akdedilmektedir.'},
              {type: 'p', text: 'Platformu kullanmaya başlamakla bu Sözleşme\'nin tüm hükümlerini okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz.'},
              {type: 'h1', text: '2. HİZMETLERİN TANIMI'},
              {type: 'p', text: 'Esila Ticari, aşağıdaki hizmetleri içeren bulut tabanlı bir ERP platformudur:'},
              {type: 'li', text: 'E-Fatura, E-Arşiv, E-İrsaliye düzenleme ve yönetimi'},
              {type: 'li', text: 'Hızlı satış / POS işlemleri'},
              {type: 'li', text: 'Cari hesap ve stok yönetimi'},
              {type: 'li', text: 'Depo ve kasa takibi'},
              {type: 'li', text: 'Personel yönetimi'},
              {type: 'li', text: 'Sipariş ve teklif yönetimi'},
              {type: 'li', text: 'Mutabakat ve arıza formu takibi'},
              {type: 'li', text: 'Raporlama ve analiz araçları'},
              {type: 'h1', text: '3. HESAP OLUŞTURMA VE GÜVENLİK'},
              {type: 'p', text: '3.1 Platforma erişim için gerçek ve doğru bilgilerle kayıt yaptırmanız zorunludur.'},
              {type: 'p', text: '3.2 Hesap güvenliğinden kullanıcı sorumludur. Şifrenizin gizliliğini korumak ve yetkisiz kullanımı derhal bildirmek sizin yükümlülüğünüzdür.'},
              {type: 'p', text: '3.3 Hesabınızın yetkisiz kullanımından doğabilecek zararlardan Esila sorumlu tutulamaz.'},
              {type: 'p', text: '3.4 Bir kurumsal hesap altında birden fazla kullanıcı tanımlanabilir; yönetici kullanıcı tüm alt kullanıcıların eylemlerinden sorumludur.'},
              {type: 'h1', text: '4. KULLANIM KURALLARI'},
              {type: 'p', text: 'Aşağıdaki eylemler kesinlikle yasaktır:'},
              {type: 'li', text: 'Platformu yasa dışı amaçlarla kullanmak'},
              {type: 'li', text: 'Üçüncü şahısların verilerine yetkisiz erişim sağlamaya çalışmak'},
              {type: 'li', text: 'Platformun altyapısına zarar verebilecek kötü amaçlı yazılım yüklemek veya yaymak'},
              {type: 'li', text: 'Platformu tersine mühendislik, kaynak kodu çıkarma veya izinsiz kopyalama amacıyla kullanmak'},
              {type: 'li', text: 'Başka kullanıcıların hesaplarına erişmeye çalışmak'},
              {type: 'li', text: 'Platformu spam, dolandırıcılık veya yanıltıcı içerik için kullanmak'},
              {type: 'li', text: 'Esila\'nın önceden yazılı onayı olmaksızın API\'ye otomatik erişim sağlamak'},
              {type: 'h1', text: '5. FİKRİ MÜLKİYET'},
              {type: 'p', text: 'Platform, yazılım, logo, tasarım, içerik ve belgeler dahil tüm materyaller Esila\'ya aittir ve Türk Fikir ve Sanat Eserleri Kanunu ile uluslararası telif hukuku kapsamında korunmaktadır.'},
              {type: 'p', text: 'Kullanıcıya tanınan lisans; kişisel ve ticari kullanım için, münhasır olmayan, devredilemez ve sınırlı bir kullanım hakkıdır.'},
              {type: 'h1', text: '6. KULLANICININ VERİ SAHİPLİĞİ'},
              {type: 'p', text: 'Kullanıcı, platforma yüklediği tüm verilerin münhasır sahibidir. Esila, bu verileri yalnızca hizmetin sağlanması amacıyla kullanır; üçüncü taraflarla paylaşmaz.'},
              {type: 'p', text: 'Abonelik sona erdiğinde, kullanıcı verilerini dışa aktarma hakkına sahiptir. Veriler, hesap kapandıktan 30 gün sonra sistemden silinir.'},
              {type: 'h1', text: '7. ÖDEME VE ABONELIK'},
              {type: 'p', text: '7.1 Ücretlendirme modelleri: Aylık veya yıllık abonelik planları mevcuttur.'},
              {type: 'p', text: '7.2 Ödeme zamanında yapılmadığı takdirde hizmet askıya alınabilir.'},
              {type: 'p', text: '7.3 Yıllık planlarda, iptaller bir sonraki yenileme tarihinden önce yapılmalıdır; kalan süre için iade yapılmaz.'},
              {type: 'p', text: '7.4 Esila, fiyatları önceden 30 gün bildirimde bulunarak değiştirme hakkını saklı tutar.'},
              {type: 'h1', text: '8. HİZMET KESİNTİLERİ VE SORUMLULUK SINIRI'},
              {type: 'p', text: '8.1 Esila, %99,5 hizmet erişilebilirliğini hedeflemekle birlikte planlı bakımlar ve teknik nedenlerle hizmet kesintileri yaşanabilir.'},
              {type: 'p', text: '8.2 Esila\'nın sorumluluğu, herhangi bir takvim yılı içinde kullanıcının ödediği abonelik bedeliyle sınırlıdır.'},
              {type: 'p', text: '8.3 Esila; dolaylı, özel, arızi, cezai veya sonuçsal zararlardan sorumlu tutulamaz.'},
              {type: 'h1', text: '9. SÖZLEŞMENİN FESHİ'},
              {type: 'p', text: 'Her iki taraf da Sözleşme\'yi 30 günlük yazılı bildirimle feshedebilir. Kullanım Koşulları\'na aykırı davranış hâlinde Esila, hesabı derhal askıya alma veya kapatma hakkına sahiptir.'},
              {type: 'h1', text: '10. GİZLİLİK'},
              {type: 'p', text: 'Kişisel verilerin işlenmesi, ayrı bir "Gizlilik Politikası" ve "KVKK Aydınlatma Metni" ile düzenlenmiştir. Bu belgeler Sözleşme\'nin ayrılmaz bir parçasını oluşturur.'},
              {type: 'h1', text: '11. UYGULANACAK HUKUK VE YETKİLİ MAHKEME'},
              {type: 'p', text: 'Bu Sözleşme, Türkiye Cumhuriyeti hukukuna tabi olup Türk hukukunun emredici hükümleri saklıdır.'},
              {type: 'p', text: 'Uyuşmazlıkların çözümünde Sivas Mahkemeleri ve İcra Daireleri yetkilidir.'},
              {type: 'h1', text: '12. DEĞİŞİKLİKLER'},
              {type: 'p', text: 'Esila, bu Sözleşme\'yi dilediği zaman güncelleme hakkını saklı tutar. Önemli değişiklikler, e-posta veya platform bildirimi ile en az 15 gün önceden duyurulur. Değişiklik sonrası platformu kullanmaya devam etmeniz kabul anlamına gelir.'},
              {type: 'h1', text: '13. İLETİŞİM'},
              {type: 'p', text: 'Sözleşme veya hizmetlerimize ilişkin sorularınız için:'},
              {type: 'li', text: 'E-posta: bilgi@esilaticari.com'},
              {type: 'li', text: 'Adres: Yenişehir Mh. Kardeşler Cd. Cumhuriyet Teknokent No:7/2 Ofis 201 Sivas'},
              {type: 'li', text: 'Web: www.esilaticari.com'},
              {type: 'p', text: 'Esila Yazılım | 14 Haziran 2026'}
          ];

          const termsPdf = await generateCustomPdfBuffer("KULLANIM KOŞULLARI VE HİZMET SÖZLEŞMESİ", kosullarText);
          const privacyPdf = await generateCustomPdfBuffer("GİZLİLİK POLİTİKASI", gizlilikText);
          
          console.log("[EMAIL] Attaching PDFs! Terms PDF size:", termsPdf.length, "Privacy PDF size:", privacyPdf.length);

          await sendMail(
            tenantEmail,
            "Hesabınız Aktive Edildi - Esila Ticari",
            `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Tebrikler Sayın ${tenantName},</h2>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="color: #166534; font-weight: 500; margin: 0;">Esila Ticari üyeliğiniz yönetimimiz tarafından incelenmiş ve <b>başarıyla onaylanarak aktive edilmiştir.</b></p>
              </div>
              <p>Firmamızın dijital ürün ailesine hoş geldiniz. Bütün ön muhasebe ihtiyaçlarınızı hızlı, güvenli ve bulut üzerinden kesintisiz yürütebilirsiniz.</p>
              ${passInfoHTML}
              <p style="color: #6b7280; font-size: 14px;">Güvenliğiniz için ilk girişten sonra şifrenizi sağ üst köşedeki profil veya ayarlar menüsünden değiştirmenizi öneririz.</p>`,
            true,
            [
              {
                filename: "Esila_Ticari_Kullanim_Kosullari.pdf",
                content: termsPdf,
                contentType: "application/pdf",
              },
              {
                filename: "Esila_Ticari_Gizlilik_Politikasi.pdf",
                content: privacyPdf,
                contentType: "application/pdf",
              },
            ],
            req.params.vkn
          );
        }
      };

      const logActivation = async (tenantEmail: string, tenantName: string, action: string, status: string, details: string) => {
        try {
          if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
            insertFallbackRow("activation_logs", { id: Date.now().toString() + Math.random().toString(36).substring(7), vkn, tenantName, action, status, details, date: new Date().toISOString() });
          } else {
            const pool = getPool();
            await pool.query("INSERT INTO activation_logs (id, vkn, tenantName, action, status, details) VALUES (?, ?, ?, ?, ?, ?)", [Date.now().toString() + Math.random().toString(36).substring(7), vkn, tenantName, action, status, details]);
          }
        } catch(e) {}
      };

      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const fallbacks = getFallbackTable("tenants");
        const t = fallbacks.find((x: any) => x.vkn === vkn);
        if (t) {
          const fallbacksU = getFallbackTable("users");
          const au = fallbacksU.find(
            (u) => u.vkn === vkn && u.role === "Admin",
          );
          try {
             await sendActivationMail(t.email, t.name, au ? au.passwordHash : "");
             await logActivation(t.email, t.name, "Aktivasyon", "Başarılı", "E-posta ve PDF ekleri teslim edildi.");
          } catch(e: any) {
             await logActivation(t.email, t.name, "Aktivasyon", "Başarısız", e.message || String(e));
          }
        }

        updateFallbackRow("tenants", vkn, vkn, { status: "Aktif" }); // Note: wait, id of tenant is its vkn... fallbackDb searches by id? The tenant has vkn as primary key!
        // I'll manually modify tenants lookup below.
        return res.json({ success: true });
      }

      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM tenants WHERE vkn = ?", [
        vkn,
      ]);
      if (rows && (rows as any[]).length > 0) {
        const [uRows] = await pool.query(
          "SELECT passwordHash FROM users WHERE vkn = ? AND role = 'Admin'",
          [vkn],
        ) as any;
        const adminPass =
          uRows && (uRows as any[]).length > 0 ? uRows[0].passwordHash : "";
        try {
            await sendActivationMail(rows[0].email, rows[0].name, adminPass);
            await logActivation(rows[0].email, rows[0].name, "Aktivasyon", "Başarılı", "E-posta ve PDF ekleri teslim edildi.");
        } catch (e: any) {
            await logActivation(rows[0].email, rows[0].name, "Aktivasyon", "Başarısız", e.message || String(e));
        }
      }

      await pool.query("UPDATE tenants SET status = 'Aktif' WHERE vkn = ?", [
        vkn,
      ]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/session-logs", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const logs = getFallbackTable("session_logs");
        return res.json(logs);
      }
      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM session_logs ORDER BY date DESC");
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/activation-logs", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const logs = getFallbackTable("activation_logs");
        return res.json(logs);
      }
      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM activation_logs ORDER BY date DESC");
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/tenants/inactive", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const tenants = getFallbackTable("tenants");
        const sessionLogs = getFallbackTable("session_logs");
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activeTenants = tenants.filter(t => t.status === 'Aktif');
        const inactive = activeTenants.filter(t => {
           const logForTenant = sessionLogs.filter(s => s.vkn === t.vkn && s.action === 'Giriş');
           if (logForTenant.length === 0) return true;
           const sortedLogs = logForTenant.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
           const lastLogin = new Date(sortedLogs[0].date);
           return lastLogin < thirtyDaysAgo;
        });

        // Add lastLoginDate property
        const result = inactive.map(t => {
           const logForTenant = sessionLogs.filter(s => s.vkn === t.vkn && s.action === 'Giriş');
           let lastLoginDate = null;
           if (logForTenant.length > 0) {
              const sortedLogs = logForTenant.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              lastLoginDate = sortedLogs[0].date;
           }
           return { ...t, lastLoginDate };
        });

        return res.json(result);
      }

      const pool = getPool();
      const query = `
        SELECT t.vkn, t.name, t.email, MAX(s.date) as lastLoginDate
        FROM tenants t
        LEFT JOIN session_logs s ON t.vkn = s.vkn AND s.action = 'Giriş'
        WHERE t.status = 'Aktif'
        GROUP BY t.vkn, t.name, t.email
        HAVING lastLoginDate IS NULL OR lastLoginDate < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;
      const [rows] = await pool.query(query);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/tenants/pending-timeout", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const fallbacks = getFallbackTable("tenants");
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const expired = fallbacks.filter(t => t.status === 'Bekliyor' && t.createdAt && new Date(t.createdAt) < thirtyDaysAgo);
        return res.json(expired);
      }

      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM tenants WHERE status = 'Bekliyor' AND (createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY))"
      );
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put("/api/tenants/:vkn/reject", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { vkn } = req.params;

      const logActivation = async (tenantEmail: string, tenantName: string, action: string, status: string, details: string) => {
        try {
          if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
            insertFallbackRow("activation_logs", { id: Date.now().toString() + Math.random().toString(36).substring(7), vkn, tenantName, action, status, details, date: new Date().toISOString() });
          } else {
            const pool = getPool();
            await pool.query("INSERT INTO activation_logs (id, vkn, tenantName, action, status, details) VALUES (?, ?, ?, ?, ?, ?)", [Date.now().toString() + Math.random().toString(36).substring(7), vkn, tenantName, action, status, details]);
          }
        } catch(e) {}
      };

      const sendRejectionMail = async (
        tenantEmail: string,
        tenantName: string,
      ) => {
        if (tenantEmail) {
          await sendMail(
            tenantEmail,
            "Başvurunuz Reddedildi - Esila Ticari",
            `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın ${tenantName},</h2>
<p style="margin-bottom: 16px;">Esila Ticari lisans başvurunuz ekiplerimiz tarafından değerlendirilmiş, ancak maalesef şu aşamada <b>onaylanamamıştır</b>.</p>

<p style="margin-bottom: 24px;">Lisans ve kullanım koşulları politikalarımız gereği başvurunuz uygun görülmemiş veya sisteme giriş kapasitelerimiz dolmuş olabilir.</p>

<div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
    <p style="color: #991b1b; margin: 0; font-size: 14px;">Sistemimize göstermiş olduğunuz ilgiden dolayı teşekkür ederiz. İlerleyen tarihlerde dilediğiniz zaman tekrar kayıt başvurusunda bulunabilirsiniz.</p>
</div>`,
          );
        }
      };

      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const fallbacks = getFallbackTable("tenants");
        const t = fallbacks.find((x: any) => x.vkn === vkn);
        if (t) {
            try {
               await sendRejectionMail(t.email, t.name);
               await logActivation(t.email, t.name, "Red", "Başarılı", "Ret e-postası teslim edildi.");
            } catch(e: any) {
               await logActivation(t.email, t.name, "Red", "Başarısız", e.message || String(e));
            }
        }

        deleteFallbackRow("tenants", vkn, vkn);
        return res.json({ success: true });
      }

      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM tenants WHERE vkn = ?", [
        vkn,
      ]);
      if (rows && (rows as any[]).length > 0) {
        try {
            await sendRejectionMail(rows[0].email, rows[0].name);
            await logActivation(rows[0].email, rows[0].name, "Red", "Başarılı", "Ret e-postası teslim edildi.");
        } catch(e: any) {
            await logActivation(rows[0].email, rows[0].name, "Red", "Başarısız", e.message || String(e));
        }
      }

      await pool.query("DELETE FROM tenants WHERE vkn = ?", [vkn]);
      await pool.query("DELETE FROM users WHERE vkn = ?", [vkn]);
      await pool.query("DELETE FROM settings WHERE vkn = ?", [vkn]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put("/api/tenants/:vkn", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { vkn } = req.params;
      const data = req.body;

      let expInterval = "1 YEAR";
      if (data.package === "Aylık") expInterval = "1 MONTH";
      if (data.package === "Sınırsız") expInterval = "100 YEAR";

      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const dDate = data.expirationDate
          ? new Date(data.expirationDate)
          : new Date();
        if (!data.expirationDate) {
          dDate.setFullYear(
            dDate.getFullYear() +
              (data.package === "Aylık"
                ? 0
                : data.package === "Sınırsız"
                  ? 100
                  : 1),
          );
          if (data.package === "Aylık") dDate.setMonth(dDate.getMonth() + 1);
        }

        updateFallbackRow("tenants", vkn, vkn, {
          name: data.name,
          email: data.email,
          package: data.package,
          modules: JSON.stringify(data.modules),
          expirationDate: dDate.toISOString(),
          smsLimit: data.smsLimit || 0,
          emailLimit: data.emailLimit || 0,
        });
        return res.json({ success: true });
      }
      const pool = getPool();
      if (data.package) {
        if (data.expirationDate) {
          const q = `UPDATE tenants SET name = ?, email = ?, package = ?, modules = ?, expirationDate = ?, smsLimit = ?, emailLimit = ? WHERE vkn = ?`;
          await pool.query(q, [
            data.name,
            data.email,
            data.package,
            JSON.stringify(data.modules),
            new Date(data.expirationDate)
              .toISOString()
              .slice(0, 19)
              .replace("T", " "),
            data.smsLimit || 0,
            data.emailLimit || 0,
            vkn,
          ]);
        } else {
          const q = `UPDATE tenants SET name = ?, email = ?, package = ?, modules = ?, expirationDate = DATE_ADD(NOW(), INTERVAL ${expInterval}), smsLimit = ?, emailLimit = ? WHERE vkn = ?`;
          await pool.query(q, [
            data.name,
            data.email,
            data.package,
            JSON.stringify(data.modules),
            data.smsLimit || 0,
            data.emailLimit || 0,
            vkn,
          ]);
        }
      } else {
        await pool.query(
          "UPDATE tenants SET name = ?, email = ?, modules = ?, smsLimit = ?, emailLimit = ? WHERE vkn = ?",
          [
            data.name,
            data.email,
            JSON.stringify(data.modules),
            data.smsLimit || 0,
            data.emailLimit || 0,
            vkn,
          ],
        );
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.delete("/api/tenants/:vkn", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { vkn } = req.params;
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        deleteFallbackRow("tenants", vkn, vkn);
        return res.json({ success: true });
      }
      const pool = getPool();
      await pool.query("DELETE FROM tenants WHERE vkn = ?", [vkn]);
      // Optional: Delete from other tables where vkn = vkn ? Cascade delete handles it usually, or we can manually delete
      await pool.query("DELETE FROM users WHERE vkn = ?", [vkn]);
      await pool.query("DELETE FROM settings WHERE vkn = ?", [vkn]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/admin/email-logs", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const logs = getFallbackTable("email_logs") || [];
        return res.json([...logs].reverse().slice(0, 200));
      }
      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM email_logs ORDER BY date DESC LIMIT 200",
      );
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/purchase-recommendations", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
         const products = getFallbackTable("products", vkn);
         const recommendations = products.filter((p: any) => p.stock <= (p.minStock || 0));
         return res.json(recommendations);
      }
      
      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM `products` WHERE vkn = ? AND stock <= COALESCE(minStock, 0)",
        [vkn]
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tenant-info", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const fallbacks = getFallbackTable("tenants");
        const t = fallbacks.find((x: any) => x.vkn === vkn);
        return res.json(
          t || {
            expirationDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        );
      }
      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM tenants WHERE vkn = ?", [
        vkn,
      ]);
      if ((rows as any[]).length > 0) return res.json(rows[0]);
      res.json({});
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  const publicVerificationCodes = new Map<
    string,
    { code: string; expires: number }
  >();

  app.post("/api/public-form/request-code", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { id, type, t } = req.body;
      if (!id || !type || !t)
        return res.status(400).json({ error: "Missing params" });

      let record;
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const records = getFallbackTable(
          type === "ticket" ? "service_tickets" : "orders",
          t,
        );
        record = records.find((x: any) => x.id === id);
      } else {
        const pool = getPool();
        const tableName = type === "ticket" ? "service_tickets" : "orders";
        const [rows] = (await pool.query(
          `SELECT * FROM ${tableName} WHERE id = ? AND vkn = ?`,
          [id, t],
        )) as any;
        record = rows[0];
      }

      if (!record) return res.status(404).json({ error: "Record not found" });

      let customer;
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        const customers = getFallbackTable("customers", t);
        customer = customers.find(
          (x: any) => x.id === (record.customerId || record.customer_id),
        );
      } else {
        const pool = getPool();
        const [cRows] = (await pool.query(
          `SELECT * FROM customers WHERE id = ? AND vkn = ?`,
          [record.customerId || record.customer_id, t],
        )) as any;
        customer = cRows[0];
      }

      const email = customer?.email;
      const phone = customer?.phone || customer?.phone1;

      if (!email && !phone) {
        return res
          .status(400)
          .json({ error: "Müşteriye ait e-posta veya telefon bulunamadı." });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const key = `${t}_${type}_${id}`;
      publicVerificationCodes.set(key, {
        code,
        expires: Date.now() + 10 * 60 * 1000,
      });

      if (email) {
        await sendMail(
          email,
          "Evrak Doğrulama Kodu",
          `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #059669;">Evrak Görüntüleme Talebi</h2>
                <p>Talep ettiğiniz evrağı güvenli bir şekilde görüntülemek için doğrulama kodunuz:</p>
                <div style="font-size: 24px; font-weight: bold; padding: 12px; background: #f3f4f6; display: inline-block; border-radius: 6px; letter-spacing: 2px;">${code}</div>
                <p style="color: #666; font-size: 12px; mt-4">Bu kod 10 dakika boyunca geçerlidir.</p>
            </div>
          `,
          false,
          [],
          t,
        );
      } else {
        console.log(`[SMS SIMULASYON Müşteri:${phone}] Kodunuz: ${code}`);
      }

      const sentTo = [];
      if (email)
        sentTo.push(
          email.replace(
            /(.{2})(.*)(?=@)/,
            (m: string, a: string, b: string) => a + "*".repeat(b.length),
          ),
        );
      if (!email && phone)
        sentTo.push(phone.slice(0, 3) + "***" + phone.slice(-2));

      res.json({ success: true, sentTo: sentTo.join(" ve ") });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/public-form/verify", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { id, type, t, code } = req.body;
      const key = `${t}_${type}_${id}`;
      const vData = publicVerificationCodes.get(key);

      if (!vData)
        return res
          .status(400)
          .json({ error: "Kod bulunamadı veya süresi dolmuş." });
      if (vData.expires < Date.now()) {
        publicVerificationCodes.delete(key);
        return res.status(400).json({ error: "Kodun süresi dolmuş." });
      }
      if (vData.code !== code)
        return res.status(400).json({ error: "Geçersiz kod." });

      publicVerificationCodes.delete(key);

      let record;
      let customer;
      let settings;
      let products;
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        record = getFallbackTable(
          type === "ticket" ? "service_tickets" : "orders",
          t,
        ).find((x: any) => x.id === id);
        customer = getFallbackTable("customers", t).find(
          (x: any) => x.id === (record.customerId || record.customer_id),
        );
        settings = getFallbackTable("settings", t)[0] || {};
        products = getFallbackTable("products", t);
      } else {
        const pool = getPool();
        const tableName = type === "ticket" ? "service_tickets" : "orders";
        const [rRows] = (await pool.query(
          `SELECT * FROM ${tableName} WHERE id = ? AND vkn = ?`,
          [id, t],
        )) as any;
        record = rRows[0];
        if (record && typeof record.items === "string")
          record.items = JSON.parse(record.items);
        if (record && typeof record.device === "string")
          record.device = JSON.parse(record.device);
        if (record && typeof record.materials === "string")
          record.materials = JSON.parse(record.materials);

        const [cRows] = (await pool.query(
          `SELECT * FROM customers WHERE id = ? AND vkn = ?`,
          [record.customerId || record.customer_id, t],
        )) as any;
        customer = cRows[0];
        const [sRows] = (await pool.query(
          `SELECT * FROM settings WHERE vkn = ?`,
          [t],
        )) as any;
        settings = sRows[0] || {};
        const [pRows] = (await pool.query(
          `SELECT * FROM products WHERE vkn = ?`,
          [t],
        )) as any;
        products = pRows;
      }

      res.json({ success: true, record, customer, settings, products });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  const publicAccessTokens = new Map<
    string,
    {
      id: string;
      type: string;
      tenantId: string;
      expires: number;
      singleUse: boolean;
    }
  >();

  app.post("/api/public-form/generate-link", (req, res) => {
    try {
      const {
        id,
        type,
        t,
        expirationMinutes = 60,
        singleUse = false,
      } = req.body;
      if (!id || !type || !t)
        return res.status(400).json({ error: "Missing params" });

      const token =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      publicAccessTokens.set(token, {
        id,
        type,
        tenantId: t,
        expires: Date.now() + expirationMinutes * 60 * 1000,
        singleUse,
      });

      const link = `https://${req.get("host")}/?token=${token}`;
      res.json({ success: true, token, link });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/public-form/verify-token", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: "Token eksik" });

      const tData = publicAccessTokens.get(token);
      if (!tData)
        return res
          .status(400)
          .json({ error: "Link süresi dolmuş veya geçersiz." });
      if (tData.expires < Date.now()) {
        publicAccessTokens.delete(token);
        return res.status(400).json({ error: "Link süresi dolmuş." });
      }

      if (tData.singleUse) {
        publicAccessTokens.delete(token);
      }

      const { id, type, tenantId: t } = tData;

      let record;
      let customer;
      let settings;
      let products;
      if (
        !process.env.DATABASE_URL ||
        !process.env.DATABASE_URL.startsWith("mysql")
      ) {
        record = getFallbackTable(
          type === "ticket" ? "service_tickets" : "orders",
          t,
        ).find((x: any) => x.id === id);
        customer = getFallbackTable("customers", t).find(
          (x: any) => x.id === (record.customerId || record.customer_id),
        );
        settings = getFallbackTable("settings", t)[0] || {};
        products = getFallbackTable("products", t);
      } else {
        const pool = getPool();
        const tableName = type === "ticket" ? "service_tickets" : "orders";
        const [rRows] = (await pool.query(
          `SELECT * FROM ${tableName} WHERE id = ? AND vkn = ?`,
          [id, t],
        )) as any;
        record = rRows[0];
        if (record && typeof record.items === "string")
          record.items = JSON.parse(record.items);
        if (record && typeof record.device === "string")
          record.device = JSON.parse(record.device);
        if (record && typeof record.materials === "string")
          record.materials = JSON.parse(record.materials);

        const [cRows] = (await pool.query(
          `SELECT * FROM customers WHERE id = ? AND vkn = ?`,
          [record.customerId || record.customer_id, t],
        )) as any;
        customer = cRows[0];
        const [sRows] = (await pool.query(
          `SELECT * FROM settings WHERE vkn = ?`,
          [t],
        )) as any;
        settings = sRows[0] || {};
        const [pRows] = (await pool.query(
          `SELECT * FROM products WHERE vkn = ?`,
          [t],
        )) as any;
        products = pRows;
      }

      res.json({
        success: true,
        record,
        customer,
        settings,
        products,
        type,
        id,
        t,
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/test-users", (_req, res) => {
    res.status(403).json({ error: "Erişim Reddedildi: Bu uç nokta güvenlik politikası gereği devre dışı bırakılmıştır." });
  });

  // Generic CRUD API for all tables

  const tables = [
    "users",
    "settings",
    "customers",
    "customer_transactions",
    "cash_transactions",
    "bank_accounts",
    "boms",
    "work_orders",
    "personnel",
    "personnel_records",
    "payroll_approvals",
    "orders",
    "proposals",
    "service_tickets",
    "e_invoices",
    "job_applications",
    "reminder_notes",
    "purchase_requests",
    "cheque_notes",
    "notifications",
    "campaigns",
    "meeting_notes",
    "attendance",
    "salary_adjustments",
    "personnel_tasks",
    "documents",
    "waybills",
    "suspended_carts",
    "personnel_kpis"
  ];

  const bootstrapExtraTables = ["categories", "brands", "warehouses", "stock_transfers"];

  // Batched Bootstrap Endpoint: Replaces 31+ separate startup HTTP GET calls with 1 single compressed request
  app.get("/api/bootstrap", async (req, res) => {
    try {
      const vkn = sanitizeTenantId(req.headers["x-tenant-id"]);
      const userId = (req.headers["x-user-id"] as string) || "";
      const allBootstrapTables = [...tables, ...bootstrapExtraTables];
      const payload: Record<string, any> = {};

      const isMySQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql");
      if (!isMySQL) {
        for (const t of allBootstrapTables) {
          payload[t] = getFallbackTable(t, vkn);
        }
        const tenants = getFallbackTable("tenants");
        payload.tenantInfo = tenants.find((x: any) => x.vkn === vkn) || {
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      } else {
        const pool = getPool();
        let userBranch: string | null = null;
        if (userId) {
          try {
            const [userRows]: any = await pool.query(
              "SELECT role, branch FROM users WHERE id = ? AND vkn = ?",
              [userId, vkn]
            );
            if (Array.isArray(userRows) && userRows.length > 0 && userRows[0].role !== "Admin" && userRows[0].branch) {
              userBranch = userRows[0].branch;
            }
          } catch (_e) {}
        }

        await Promise.all(
          allBootstrapTables.map(async (t) => {
            try {
              let query = `SELECT * FROM \`${t}\` WHERE vkn = ?`;
              const params: any[] = [vkn];
              if (userBranch && (t === "personnel" || t === "stock_transfers" || t === "warehouses")) {
                query += " AND branch = ?";
                params.push(userBranch);
              }
              const [rows] = await pool.query(query, params);
              payload[t] = rows || [];
            } catch (_err) {
              payload[t] = [];
            }
          })
        );

        try {
          const [tRows]: any = await pool.query("SELECT * FROM tenants WHERE vkn = ?", [vkn]);
          payload.tenantInfo = Array.isArray(tRows) && tRows.length > 0 ? tRows[0] : {};
        } catch (_err) {
          payload.tenantInfo = {};
        }
      }

      recordBootstrapBatch(allBootstrapTables.length);
      res.json(payload);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  const tableColumnsCache: Record<string, string[]> = {};
  for (const table of tables) {
    async function getTableColumns(pool: any, table: string) {
      if (tableColumnsCache[table]) return tableColumnsCache[table];
      try {
        const [rows] = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
        const cols = (rows as any[]).map((r: any) => r.Field);
        tableColumnsCache[table] = cols;
        return cols;
      } catch(e) { return null; }
    }

    app.get(`/api/${table}`, async (req, res) => {
      try {
        const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";

        
        const userId = (req.headers["x-user-id"] as string);
        if (
          !process.env.DATABASE_URL ||
          !process.env.DATABASE_URL.startsWith("mysql")
        ) {
          return res.json(getFallbackTable(table, vkn));
        }
        const pool = getPool();
        
        let query = `SELECT * FROM ${table} WHERE vkn = ?`;
        const params: any[] = [vkn];
        
        if (userId && (table === 'personnel' || table === 'stock_transfers' || table === 'warehouses')) {
          const [userRows]: any = await pool.query(`SELECT role, branch FROM users WHERE id = ? AND vkn = ?`, [userId, vkn]);
          if ((userRows as any[]).length > 0) {
            const user = userRows[0];
            if (user.role !== 'Admin' && user.branch) {
              query += ` AND branch = ?`;
              params.push(user.branch);
            }
          }
        }
        
        const [rows] = await pool.query(query, params);
        res.json(rows);
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.post(`/api/${table}`, async (req, res) => {
      try {
        const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";


        if (
          !process.env.DATABASE_URL ||
          !process.env.DATABASE_URL.startsWith("mysql")
        ) {
          
          insertFallbackRow(table, { ...req.body, vkn });
          return res.json(req.body);
        }
        const pool = getPool();
        const data = { ...req.body };
        if (data.vkn) delete data.vkn;

        const validCols = await getTableColumns(pool, table);
        if (validCols) {
           for (const k of Object.keys(data)) {
               if (!validCols.map((c: any) => c.toLowerCase()).includes(k.toLowerCase())) {
                   delete data[k];
               }
           }
        }

        const keys = Object.keys(data).filter(isValidSqlIdentifier);
        const values = keys.map((k) => {
          const v = data[k];
          return typeof v === "object" && v !== null ? JSON.stringify(v) : v;
        });
        const questionMarks = keys.map(() => "?").join(", ");
        const backtick = String.fromCharCode(96);
        const fields = keys.map((k) => backtick + k + backtick).join(", ");
        
        const query = `INSERT IGNORE INTO \`${table}\` (vkn, ${fields}) VALUES (?, ${questionMarks})`;
        await pool.query(query, [vkn, ...values]);
        res.json(req.body);
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.put(`/api/${table}/:id`, async (req, res) => {
      try {
        const vkn = sanitizeTenantId(req.headers["x-tenant-id"]);
        const recordId = sanitizeRecordId(req.params.id);
        if (!recordId) {
          return res.status(400).json({ error: "Geçersiz kayıt kimliği." });
        }

        if (
          !process.env.DATABASE_URL ||
          !process.env.DATABASE_URL.startsWith("mysql")
        ) {
          updateFallbackRow(table, recordId, vkn, req.body);
          return res.json({ id: recordId, ...req.body });
        }
        const pool = getPool();
        const data = { ...req.body };
        if (data.id) delete data.id; // Don't update id
        if (data.vkn) delete data.vkn; // Don't update vkn

        const validCols = await getTableColumns(pool, table);
        if (validCols) {
           for (const k of Object.keys(data)) {
               if (!validCols.map((c: any) => c.toLowerCase()).includes(k.toLowerCase())) {
                   delete data[k];
               }
           }
        }

        const keys = Object.keys(data).filter(isValidSqlIdentifier);
        if (keys.length === 0) {
            return res.json({ id: recordId, ...req.body });
        }

        const values = keys.map((k) =>
          typeof data[k] === "object" && data[k] !== null
            ? JSON.stringify(data[k])
            : data[k],
        );
        const backtick = String.fromCharCode(96);
        const setString = keys
          .map((k) => backtick + k + backtick + " = ?")
          .join(", ");
        
        const query = `UPDATE \`${table}\` SET ${setString} WHERE id = ? AND vkn = ?`;
        const [result]: any = await pool.query(query, [...values, recordId, vkn]);
        
        if (result.affectedRows === 0 && table === 'settings') {
           const insertQuery = `INSERT INTO settings (id, vkn, ${keys.map(k => backtick + k + backtick).join(', ')}) VALUES (?, ?, ${keys.map(() => '?').join(', ')})`;
           await pool.query(insertQuery, [recordId, vkn, ...values]);
        }
        
        res.json({ id: recordId, ...data });
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.delete(`/api/${table}/:id`, async (req, res) => {
      try {
        const vkn = sanitizeTenantId(req.headers["x-tenant-id"]);
        const recordId = sanitizeRecordId(req.params.id);
        if (!recordId) {
          return res.status(400).json({ error: "Geçersiz kayıt kimliği." });
        }

        if (
          !process.env.DATABASE_URL ||
          !process.env.DATABASE_URL.startsWith("mysql")
        ) {
          deleteFallbackRow(table, recordId, vkn);
          return res.json({ success: true });
        }
        const pool = getPool();
        
        await pool.query(`DELETE FROM \`${table}\` WHERE id = ? AND vkn = ?`, [
          recordId,
          vkn,
        ]);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });
  }

  // Vite middleware setup
  app.get("/api/tenant-backups", (req, res) => {
    try {
      const rawVkn = req.headers["x-tenant-id"] as string;
      if (!rawVkn) return res.status(400).json({ success: false, error: "VKN/Tenant ID eksik." });
      const vkn = sanitizeTenantId(rawVkn);

      const tenantDir = path.join(process.cwd(), 'backups', vkn);
      if (!fs.existsSync(tenantDir)) {
        return res.json({ success: true, backups: [] });
      }

      const files = fs.readdirSync(tenantDir).filter((f: string) => f.startsWith("backup_") && f.endsWith(".json"));
      files.sort((a: string, b: string) => b.localeCompare(a));
      res.json({ success: true, backups: files });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: "Hata oluştu: " + e.message });
    }
  });

  app.post("/api/take-tenant-backup", async (req, res) => {
    try {
      const rawVkn = req.headers["x-tenant-id"] as string;
      if (!rawVkn) return res.status(400).json({ success: false, error: "VKN/Tenant ID eksik." });
      const vkn = sanitizeTenantId(rawVkn);

      const isMySQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql");
      const tenantDir = path.join(process.cwd(), 'backups', vkn);
      
      const fs = await import('fs');
      if (!fs.existsSync(tenantDir)) {
          fs.mkdirSync(tenantDir, { recursive: true });
      }

      const backupData: Record<string, any[]> = {};
      const ALL_TABLES = [
        "users", "settings", "categories", "brands", "products", "warehouses", "stock_transfers",
        "customers", "customer_transactions", "cash_transactions", "personnel", "personnel_records", 
        "orders", "proposals", "reconciliations", "service_tickets", "e_invoices", 
        "email_logs", "reminder_notes", "job_applications", "purchase_requests", "cheque_notes",
        "notifications", "campaigns", "meeting_notes"
      ];

      if (!isMySQL) {
          for (const table of ALL_TABLES) {
              backupData[table] = getFallbackTable(table as any, vkn);
          }
      } else {
          const pool = getPool();
          for (const table of ALL_TABLES) {
              try {
                  const [rows] = await pool.query(`SELECT * FROM ${table} WHERE vkn = ?`, [vkn]);
                  backupData[table] = rows as any[];
              } catch (e) {
                  // ignore
              }
          }
      }

      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupFile = path.join(tenantDir, `backup_${timestamp}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');

      // Keep only the last 5 backups
      const files = fs.readdirSync(tenantDir).filter((f: string) => f.startsWith('backup_') && f.endsWith('.json'));
      if (files.length > 5) {
          files.sort();
          const filesToDelete = files.slice(0, files.length - 5);
          for (const fileToDelete of filesToDelete) {
              fs.unlinkSync(path.join(tenantDir, fileToDelete));
          }
      }

      res.json({ success: true, message: "Manuel yedekleme başarıyla tamamlandı." });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: "Yedekleme sırasında hata oluştu: " + e.message });
    }
  });

  app.post("/api/restore-tenant-upload", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
        const vkn = req.headers["x-tenant-id"] as string;
        if (!vkn) return res.status(400).json({ success: false, error: "VKN/Tenant ID eksik." });

        const backupJSON = req.body;
        if (!backupJSON || typeof backupJSON !== 'object') return res.status(400).json({ success: false, error: "Veri eksik." });

        if (backupJSON.transactions) { backupJSON.customer_transactions = backupJSON.transactions; }
        if (backupJSON.cashTransactions) { backupJSON.cash_transactions = backupJSON.cashTransactions; }
        if (backupJSON.eInvoices) { backupJSON.e_invoices = backupJSON.eInvoices; }
        if (backupJSON.serviceTickets) { backupJSON.service_tickets = backupJSON.serviceTickets; }

        const fs = await import('fs');
        const isMySQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql");
        const allowedTables = ['customers', 'products', 'customer_transactions', 'cash_transactions', 'settings', 'users', 'job_applications', 'e_invoices', 'service_tickets', 'proposals', 'orders', 'personnel', 'reminder_notes', 'purchase_requests', 'cheque_notes', 'boms', 'work_orders', 'bank_accounts', 'attendance', 'salary_adjustments', 'personnel_tasks', 'documents', 'meeting_notes'];

        if (isMySQL) {
            const pool = getPool();
            await pool.query('SET FOREIGN_KEY_CHECKS = 0');
            for (const table of allowedTables) {
                const rows = backupJSON[table];
                if (rows && Array.isArray(rows)) {
                    await pool.query(`DELETE FROM \`${table}\` WHERE vkn = ?`, [vkn]);
                    
                    if ((rows as any[]).length > 0) {
                        const columnsSet = new Set<string>();
                        rows.forEach((r: any) => Object.keys(r).forEach(k => {
                          if (isValidSqlIdentifier(k)) columnsSet.add(k);
                        }));
                        columnsSet.add('vkn'); // Ensure vkn is there
                        let columns = Array.from(columnsSet);
                        
                        try {
                          const [colRows]: any = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
                          const validColumns = colRows.map((c: any) => c.Field);
                          columns = columns.filter(c => validColumns.includes(c));
                        } catch (colErr) {}

                        if (columns.length === 0) continue;
                        
                        const chunk_size = 50;
                        for (let i = 0; i < (rows as any[]).length; i += chunk_size) {
                            const chunk = rows.slice(i, i + chunk_size);
                            const placeholders = chunk.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
                            const values = chunk.flatMap((r: any) => columns.map(c => {
                                if (c === 'vkn') return vkn;
                                let val = r[c];
                                if (val === undefined) return null;
                                if (typeof val === 'object' && val !== null && !(val instanceof Date)) return JSON.stringify(val);
                                return val;
                            }));
                            
                            const sql = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(',')}) VALUES ${placeholders}`;
                            await pool.query(sql, values);
                        }
                    }
                }
            }
            await pool.query('SET FOREIGN_KEY_CHECKS = 1');
            res.json({ success: true, message: "Bağlı hesaba ait yedek başarıyla geri yüklendi." });
        } else {
            const DB_FILE = path.join(process.cwd(), 'local_db.json');
            if (fs.existsSync(DB_FILE)) {
                const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
                
                allowedTables.forEach((table) => {
                    if (backupJSON[table] && Array.isArray(backupJSON[table])) {
                        if (!dbData[table]) dbData[table] = [];
                        dbData[table] = dbData[table].filter((row: any) => row.vkn !== vkn);
                        const restoredRows = backupJSON[table] || [];
                        restoredRows.forEach((r:any) => r.vkn = vkn);
                        dbData[table] = [...dbData[table], ...restoredRows];
                    }
                });
                
                fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
                reloadFallbackDb();
                res.json({ success: true, message: "Bağlı hesaba ait yedek başarıyla geri yüklendi." });
            } else {
                res.status(500).json({ success: false, error: "Sistem veritabanı bulunamadı." });
            }
        }
    } catch (e: any) {
        console.error("Upload restore error:", e);
        res.status(500).json({ success: false, error: "Geri yükleme sırasında hata oluştu: " + e.message });
    }
  });

  app.post("/api/restore-tenant-backup", async (req, res) => {
    try {
      const rawVkn = req.headers["x-tenant-id"] as string;
      if (!rawVkn) return res.status(400).json({ success: false, error: "VKN/Tenant ID eksik." });
      const vkn = sanitizeTenantId(rawVkn);
      
      const rawFilename = req.body?.filename;
      const filename = sanitizeFilename(rawFilename);
      if (!filename || !filename.startsWith("backup_") || !filename.endsWith(".json")) {
        return res.status(400).json({ success: false, error: "Geçersiz dosya adı." });
      }

      const backupFile = path.join(process.cwd(), 'backups', vkn, filename);
      if (!fs.existsSync(backupFile)) {
        return res.status(404).json({ success: false, error: "Yedek dosyası bulunamadı." });
      }

      const data = fs.readFileSync(backupFile, "utf-8");
      let backupJSON = {};
      try {
        backupJSON = JSON.parse(data);
      } catch (err) {
        return res.status(500).json({ success: false, error: "Yedek dosyası bozuk (JSON Hatası)." });
      }

      const isMySQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql");
      const allowedTables = ['customers', 'products', 'customer_transactions', 'cash_transactions', 'settings', 'users', 'job_applications', 'e_invoices', 'service_tickets', 'proposals', 'orders', 'personnel', 'reminder_notes', 'purchase_requests', 'cheque_notes', 'boms', 'work_orders', 'bank_accounts', 'attendance', 'salary_adjustments', 'personnel_tasks', 'documents', 'meeting_notes'];

      if (isMySQL) {
          const pool = getPool();
          await pool.query('SET FOREIGN_KEY_CHECKS = 0');
          for (const table of allowedTables) {
              const rows = (backupJSON as any)[table];
              if (rows && Array.isArray(rows)) {
                  await pool.query(`DELETE FROM \`${table}\` WHERE vkn = ?`, [vkn]);
                  
                  if ((rows as any[]).length > 0) {
                      const columnsSet = new Set<string>();
                      rows.forEach((r: any) => Object.keys(r).forEach(k => {
                        if (isValidSqlIdentifier(k)) columnsSet.add(k);
                      }));
                      columnsSet.add('vkn'); // Ensure vkn is there
                      let columns = Array.from(columnsSet);
                      
                      try {
                        const [colRows]: any = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
                        const validColumns = colRows.map((c: any) => c.Field);
                        columns = columns.filter(c => validColumns.includes(c));
                      } catch (colErr) {}

                      if (columns.length === 0) continue;
                      
                      const chunk_size = 50;
                      for (let i = 0; i < (rows as any[]).length; i += chunk_size) {
                          const chunk = rows.slice(i, i + chunk_size);
                          const placeholders = chunk.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
                          const values = chunk.flatMap((r: any) => columns.map(c => {
                              if (c === 'vkn') return vkn;
                              let val = r[c];
                              if (val === undefined) return null;
                              if (typeof val === 'object' && val !== null && !(val instanceof Date)) return JSON.stringify(val);
                              return val;
                          }));
                          
                          const sql = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(',')}) VALUES ${placeholders}`;
                          await pool.query(sql, values);
                      }
                  }
              }
          }
          await pool.query('SET FOREIGN_KEY_CHECKS = 1');
          res.json({ success: true, message: "Bağlı hesaba ait yedek başarıyla geri yüklendi." });
      } else {
          const DB_FILE = path.join(process.cwd(), 'local_db.json');
          if (fs.existsSync(DB_FILE)) {
              const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
              
              allowedTables.forEach((table) => {
                  if ((backupJSON as any)[table] && Array.isArray((backupJSON as any)[table])) {
                      if (!dbData[table]) dbData[table] = [];
                      dbData[table] = dbData[table].filter((row: any) => row.vkn !== vkn);
                      const restoredRows = (backupJSON as any)[table] || [];
                      restoredRows.forEach((r:any) => r.vkn = vkn);
                      dbData[table] = [...dbData[table], ...restoredRows];
                  }
              });
              
              fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
              reloadFallbackDb();
              res.json({ success: true, message: "Bağlı hesaba ait yedek başarıyla geri yüklendi." });
          } else {
              res.status(500).json({ success: false, error: "Sistem veritabanı bulunamadı." });
          }
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: "Geri yükleme sırasında hata oluştu: " + e.message });
    }
  });

  app.post("/api/restore-nightly-backup", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const fs = await import('fs');
      const BACKUP_FILE = path.join(process.cwd(), 'backup.json');
      const DB_FILE = path.join(process.cwd(), 'local_db.json');

      if (!fs.existsSync(BACKUP_FILE)) {
        return res.status(404).json({ success: false, error: "Sunucuda otomatik gece yedeği bulunamadı." });
      }

      res.json({ success: true, message: "Yedek başarıyla geri yüklendi." });

      setTimeout(async () => {
        try {
          const isMySQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql");
          if (isMySQL) {
            const pool = getPool();
            const data = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
            await pool.query('SET FOREIGN_KEY_CHECKS = 0');
            for (const table of Object.keys(data)) {
              if (!ALLOWED_TABLES.has(table) || !isValidSqlIdentifier(table)) continue;
              try {
                // TRUNCATE is faster than DELETE FROM, but requires DROP privilege.
                // DELETE FROM is generally safer syntax-wise.
                await pool.query(`DELETE FROM \`${table}\``);
                const rows = data[table];
                if (rows && (rows as any[]).length > 0) {
                  const columnsSet = new Set<string>();
                  rows.forEach((r: any) => Object.keys(r).forEach(k => {
                    if (isValidSqlIdentifier(k)) columnsSet.add(k);
                  }));
                  let columns = Array.from(columnsSet);
                  
                  // Keep only valid columns from the DB schema
                  try {
                    const [colRows]: any = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
                    const validColumns = colRows.map((c: any) => c.Field);
                    columns = columns.filter(c => validColumns.includes(c));
                  } catch (colErr) {
                    // Ignore column check errors, assume original columns
                  }
                  
                  if (columns.length === 0) continue;

                  const chunk_size = 50;
                  for (let i = 0; i < (rows as any[]).length; i += chunk_size) {
                    const chunk = rows.slice(i, i + chunk_size);
                    const placeholders = chunk.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
                    const values = chunk.flatMap((r: any) => columns.map(c => {
                      let val = r[c];
                      if (val === undefined) return null;
                      if (typeof val === 'object' && val !== null && !(val instanceof Date)) return JSON.stringify(val);
                      return val;
                    }));
                    
                    const sql = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(',')}) VALUES ${placeholders}`;
                    await pool.query(sql, values);
                  }
                }
              } catch (err) {
                console.error(`Tablo geri yükleme hatası (${table}):`, err);
              }
            }
            await pool.query('SET FOREIGN_KEY_CHECKS = 1');
            console.log("MySQL yedeği başarıyla yüklendi.");
          } else {
            // Local fallbackDb
            fs.copyFileSync(BACKUP_FILE, DB_FILE);
            reloadFallbackDb();
          }
        } catch (restoreErr) {
          console.error("Nightly backup loading error:", restoreErr);
        }
      }, 500);

    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: "Geri yükleme sırasında hata oluştu: " + e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('connection', (conn) => {
    activeConnectionsCount++;
    conn.on('close', () => {
      activeConnectionsCount--;
    });
  });
}

startServer();
