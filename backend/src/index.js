import fs from 'fs';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { query } from './db.js';
import { login, signup, forgotPassword, resetPassword, authenticateToken, checkAdmin, resetUserPasswordToDefault, invalidateUserSessions, invalidateAllSessions } from './auth.js';
import { toEvolutionNumber } from './utils/messageUtils.js';
import { getActiveGeminiKey, incrementKeyUsage, logGeminiUsage } from './services/aiService.js';
import { executeWhatsappCampaignDelivery, validateCampaignDeliveryPayload } from './services/campaignDeliveryService.js';
import { buildContactSendHistoryEntry, insertContactSendHistory, normalizeJsonbInput } from './services/sendHistoryService.js';
import { listWarmers, createWarmer, updateWarmer, toggleWarmerStatus, getWarmerLogs, forceWarmerRun } from './controllers/warmerController.js';
import {
  MAX_FILE_SIZE_BYTES,
  DEFAULT_DAILY_MESSAGE_LIMIT,
  DEFAULT_MONTHLY_MESSAGE_LIMIT,
  DEFAULT_GLOBAL_GEMINI_DAILY_LIMIT,
  DEFAULT_USER_UPLOAD_QUOTA_BYTES,
  ensureUploadStorageRoot,
  ensureUserUploadDir,
  buildStoredFileName,
  buildStoredFilePath,
  buildPublicFileToken,
  formatUploadFileResponse,
  getUploadUsageBytes,
  normalizeUploadDisplayName,
  resolveFileRule,
  safeUnlink,
} from './services/uploadService.js';

process.env.TZ = process.env.SYSTEM_TIMEZONE || process.env.TZ || 'America/Sao_Paulo';

const app = express();
const port = process.env.PORT || 4000;
const SYSTEM_TIMEZONE = process.env.SYSTEM_TIMEZONE || 'America/Sao_Paulo';
const SYSTEM_TIMEZONE_LABEL = 'GMT-3 (America/Sao_Paulo)';
const ACTIVE_USER_WINDOW_SECONDS = 120;

ensureUploadStorageRoot();

const allowedOrigins = [
  'https://sendmessage-frontend.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173'
];

const corsOptions = {
  origin: (origin, callback) => {
    const isExtensionOrigin = typeof origin === 'string' && (
      origin.startsWith('chrome-extension://') ||
      origin.startsWith('moz-extension://')
    );

    if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || isExtensionOrigin) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Bloqueado: ${origin}`);
      callback(new Error('Não permitido pela política CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false, // Desabilitado: usamos Bearer Token, não Cookies/Sessão
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '20mb' }));

// Garante que o Preflight (OPTIONS) responda com os mesmos headers sem passar por auth guards
app.options('*', cors(corsOptions));

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);

async function parseJsonResponseSafe(response) {
  const rawText = await response.text();

  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { error: rawText };
  }
}

async function resolveGeminiAccessForUser(userId) {
  const [profileResult, settingsResult] = await Promise.all([
    query(
      'SELECT use_global_ai, ai_api_key FROM user_profiles WHERE id = $1 LIMIT 1',
      [userId]
    ),
    query('SELECT global_ai_api_key FROM app_settings LIMIT 1')
  ]);

  const profile = profileResult.rows[0] || {};
  const settings = settingsResult.rows[0] || {};
  const useGlobalAi = profile.use_global_ai ?? true;
  const userAiKey = String(profile.ai_api_key || '').trim();
  const globalAiKey = String(settings.global_ai_api_key || '').trim();

  if (!useGlobalAi && userAiKey) {
    return { apiKey: userAiKey, source: 'user-profile', keyData: null };
  }

  const pooledKey = await getActiveGeminiKey();
  if (pooledKey?.api_key) {
    return { apiKey: pooledKey.api_key, source: 'global-pool', keyData: pooledKey };
  }

  if (useGlobalAi && globalAiKey) {
    return { apiKey: globalAiKey, source: 'legacy-global-settings', keyData: null };
  }

  const envKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (envKey) {
    return { apiKey: envKey, source: 'environment', keyData: null };
  }

  return { apiKey: null, source: 'none', keyData: null };
}

async function isAdminUser(userId) {
  const result = await query(
    `SELECT 1
     FROM user_profiles up
     JOIN user_groups ug ON ug.id = up.group_id
     WHERE up.id = $1 AND ug.name = 'Administrador'
     LIMIT 1`,
    [userId]
  );

  return result.rows.length > 0;
}

async function cleanupExpiredPresenceSessions() {
  await ensureActiveUserSessionsTable();
  await query(
    `DELETE FROM active_user_sessions
     WHERE last_seen_at < CURRENT_TIMESTAMP - INTERVAL '1 day'`
  );
}

async function ensureActiveUserSessionsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS active_user_sessions (
      session_id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      current_page TEXT,
      user_agent TEXT,
      last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(
    `CREATE INDEX IF NOT EXISTS idx_active_user_sessions_last_seen_at
     ON active_user_sessions(last_seen_at DESC)`
  );

  await query(
    `CREATE INDEX IF NOT EXISTS idx_active_user_sessions_user_last_seen_at
     ON active_user_sessions(user_id, last_seen_at DESC)`
  );
}

async function upsertPresenceSession({ sessionId, userId, currentPage, userAgent }) {
  await ensureActiveUserSessionsTable();
  await query(
    `INSERT INTO active_user_sessions (session_id, user_id, current_page, user_agent, last_seen_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (session_id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       current_page = EXCLUDED.current_page,
       user_agent = EXCLUDED.user_agent,
       last_seen_at = CURRENT_TIMESTAMP`,
    [sessionId, userId, currentPage || null, userAgent || null]
  );
}

function buildRequestBaseUrl(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const protocol = forwardedProto || req.protocol || 'https';
  const host = forwardedHost || req.get('host');
  return `${protocol}://${host}`;
}

async function ensureContactSendHistoryTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS contact_send_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
      campaign_name TEXT,
      contact_name TEXT,
      phone_key TEXT,
      channel TEXT,
      ok BOOLEAN DEFAULT false,
      status INTEGER,
      webhook_ok BOOLEAN DEFAULT false,
      provider_status TEXT,
      error_detail TEXT,
      payload_raw JSONB,
      delivery_summary JSONB,
      run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getEffectiveLimitSnapshot(userId) {
  const [isAdmin, settingsResult, profileResult, sentTodayResult, sentMonthResult, geminiUsageResult, uploadUsageBytes] =
    await Promise.all([
      isAdminUser(userId),
      query(
        `SELECT
           default_daily_message_limit,
           default_monthly_message_limit,
           default_upload_quota_bytes,
           global_gemini_daily_limit
         FROM app_settings
         ORDER BY id DESC
         LIMIT 1`
      ),
      query(
        `SELECT
           use_global_ai,
           daily_message_limit,
           monthly_message_limit,
           upload_quota_bytes
         FROM user_profiles
         WHERE id = $1
         LIMIT 1`,
        [userId]
      ),
      query(
        `SELECT COUNT(*)::int AS total
         FROM contact_send_history
         WHERE user_id = $1
           AND channel = 'whatsapp'
           AND ok = true
           AND run_at >= CURRENT_DATE`,
        [userId]
      ),
      query(
        `SELECT COUNT(*)::int AS total
         FROM contact_send_history
         WHERE user_id = $1
           AND channel = 'whatsapp'
           AND ok = true
           AND date_trunc('month', run_at) = date_trunc('month', CURRENT_DATE)`,
        [userId]
      ),
      query(
        `SELECT COUNT(*)::int AS total
         FROM gemini_api_usage_logs
         WHERE source = 'global-pool'
           AND data_solicitacao >= CURRENT_DATE`
      ),
      getUploadUsageBytes(query, userId),
    ]);

  const settings = settingsResult.rows[0] || {};
  const profile = profileResult.rows[0] || {};
  const uploadLimit = isAdmin
    ? null
    : Number(profile.upload_quota_bytes || settings.default_upload_quota_bytes || DEFAULT_USER_UPLOAD_QUOTA_BYTES);

  return {
    isAdmin,
    dailyMessages: {
      used: Number(sentTodayResult.rows[0]?.total || 0),
      limit: Number(profile.daily_message_limit || settings.default_daily_message_limit || DEFAULT_DAILY_MESSAGE_LIMIT),
    },
    monthlyMessages: {
      used: Number(sentMonthResult.rows[0]?.total || 0),
      limit: Number(profile.monthly_message_limit || settings.default_monthly_message_limit || DEFAULT_MONTHLY_MESSAGE_LIMIT),
    },
    geminiGlobal: {
      usingGlobalPool: profile.use_global_ai ?? true,
      usedToday: Number(geminiUsageResult.rows[0]?.total || 0),
      limit: Number(settings.global_gemini_daily_limit || DEFAULT_GLOBAL_GEMINI_DAILY_LIMIT),
    },
    uploads: {
      usedBytes: Number(uploadUsageBytes || 0),
      limitBytes: uploadLimit,
      unlimited: isAdmin,
    },
  };
}

const uploadStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return cb(new Error('Usuário não autenticado para upload.'), '');
      }
      const userDir = ensureUserUploadDir(userId);
      cb(null, userDir);
    } catch (error) {
      cb(error, '');
    }
  },
  filename: (_req, file, cb) => {
    cb(null, buildStoredFileName(file.originalname));
  },
});

const uploadMiddleware = multer({
  storage: uploadStorage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const rule = resolveFileRule(file.mimetype, file.originalname);
    if (!rule) {
      return cb(new Error('Tipo de arquivo não permitido. Envie imagem, PDF, PPTX, WAV ou MP4.'));
    }
    cb(null, true);
  },
});

function parseCampaignChannels(channels) {
  if (Array.isArray(channels)) return channels;
  if (typeof channels === 'string') {
    try {
      const parsed = JSON.parse(channels);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function resolveEvolutionConfigForUser(userId) {
  const [profileResult, globalSettingsResult] = await Promise.all([
    query(
      'SELECT evolution_url, evolution_apikey, evolution_instance FROM user_profiles WHERE id = $1 LIMIT 1',
      [userId]
    ),
    query(
      'SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM app_settings ORDER BY id DESC LIMIT 1'
    ),
  ]);

  const profile = profileResult.rows[0] || {};
  const globalSettings = globalSettingsResult.rows[0] || {};

  return {
    evolutionUrl: String(profile.evolution_url || globalSettings.evolution_api_url || '').trim(),
    evolutionApiKey: String(profile.evolution_apikey || globalSettings.evolution_api_key || '').trim(),
    evolutionInstance: String(profile.evolution_instance || globalSettings.evolution_shared_instance || '').trim(),
  };
}

async function summarizeCampaignQueue(campaignId) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'pendente')::int AS pendente,
       COUNT(*) FILTER (WHERE status = 'processando')::int AS processando,
       COUNT(*) FILTER (WHERE status = 'enviado')::int AS enviado,
       COUNT(*) FILTER (WHERE status = 'falhou')::int AS falhou
     FROM message_queue
     WHERE campaign_id = $1`,
    [campaignId]
  );

  return result.rows[0] || { pendente: 0, processando: 0, enviado: 0, falhou: 0 };
}

async function syncCampaignStatusFromQueue(campaignId) {
  const summary = await summarizeCampaignQueue(campaignId);
  const pending = Number(summary.pendente || 0);
  const processing = Number(summary.processando || 0);
  const sent = Number(summary.enviado || 0);
  const failed = Number(summary.falhou || 0);

  let nextStatus = 'rascunho';
  if (pending > 0 || processing > 0) {
    nextStatus = 'agendada';
  } else if (failed > 0) {
    nextStatus = 'enviada_com_erros';
  } else if (sent > 0) {
    nextStatus = 'enviada';
  }

  await query('UPDATE campaigns SET status = $1 WHERE id = $2', [nextStatus, campaignId]);
  return nextStatus;
}

async function getServerClock() {
  const result = await query(
    `SELECT
       NOW() AS server_time,
       TO_CHAR(NOW() AT TIME ZONE '${SYSTEM_TIMEZONE}', 'YYYY-MM-DD') AS server_date,
       TO_CHAR(NOW() AT TIME ZONE '${SYSTEM_TIMEZONE}', 'HH24:MI:SS') AS server_time_only,
       '${SYSTEM_TIMEZONE_LABEL}' AS timezone`
  );

  return result.rows[0] || null;
}

function getSystemDateTimeParts() {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: SYSTEM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value])
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
    timeShort: `${parts.hour}:${parts.minute}`,
  };
}

function normalizeGeminiModel(model) {
  const requestedModel = String(model || '').trim();

  if (!requestedModel) {
    return 'gemini-2.5-flash';
  }

  const legacyMap = {
    'gemini-1.5-flash-latest': 'gemini-2.5-flash',
    'gemini-1.5-pro-latest': 'gemini-2.5-pro',
    'gemini-1.0-pro': 'gemini-2.5-flash',
    'gemini-2.0-flash': 'gemini-2.5-flash',
    'gemini-2.0-flash-001': 'gemini-2.5-flash',
    'gemini-2.0-flash-lite': 'gemini-2.5-flash-lite',
  };

  return legacyMap[requestedModel] || requestedModel;
}

function modelSupportsThinkingBudget(model) {
  return /^gemini-2\.5-/i.test(String(model || '').trim());
}

function resolveGeminiApiVersion(model, requestedVersion) {
  const normalizedRequested = requestedVersion === 'v1beta' ? 'v1beta' : 'v1';

  if (modelSupportsThinkingBudget(model)) {
    return 'v1beta';
  }

  return normalizedRequested;
}

// A partir daqui, as rotas podem ser protegidas se necessário
// app.use(authenticateToken); 

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, email, name FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

app.post('/api/auth/presence', authenticateToken, async (req, res) => {
  try {
    const sessionId = String(req.body?.sessionId || '').trim();
    const currentPage = String(req.body?.currentPage || '').trim();

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId é obrigatório.' });
    }

    await upsertPresenceSession({
      sessionId,
      userId: req.user.id,
      currentPage,
      userAgent: req.headers['user-agent'],
    });

    await cleanupExpiredPresenceSessions();

    res.json({ ok: true, windowSeconds: ACTIVE_USER_WINDOW_SECONDS });
  } catch (error) {
    console.error('[Presence] Erro ao registrar presença:', error);
    res.status(500).json({ error: 'Erro ao registrar presença.' });
  }
});

app.post('/api/auth/presence/logout', authenticateToken, async (req, res) => {
  try {
    const sessionId = String(req.body?.sessionId || '').trim();
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId é obrigatório.' });
    }

    await ensureActiveUserSessionsTable();

    await query(
      `DELETE FROM active_user_sessions
       WHERE session_id = $1
         AND user_id = $2`,
      [sessionId, req.user.id]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('[Presence] Erro ao encerrar presença:', error);
    res.status(500).json({ error: 'Erro ao encerrar presença.' });
  }
});

app.get('/api/admin/active-users', authenticateToken, checkAdmin, async (_req, res) => {
  try {
    await ensureActiveUserSessionsTable();
    await cleanupExpiredPresenceSessions();

    const sessionsResult = await query(
      `SELECT
         s.session_id,
         s.user_id,
         s.current_page,
         s.last_seen_at,
         u.email,
         u.name
       FROM active_user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.last_seen_at >= CURRENT_TIMESTAMP - ($1::text || ' seconds')::interval
       ORDER BY s.last_seen_at DESC`,
      [String(ACTIVE_USER_WINDOW_SECONDS)]
    );

    const latestByUser = new Map();
    for (const row of sessionsResult.rows) {
      if (!latestByUser.has(row.user_id)) {
        latestByUser.set(row.user_id, row);
      }
    }

    const users = Array.from(latestByUser.values()).map((row) => ({
      userId: row.user_id,
      sessionId: row.session_id,
      email: row.email,
      name: row.name || row.email,
      currentPage: row.current_page || null,
      lastSeenAt: row.last_seen_at,
    }));

    res.json({
      totalUsers: users.length,
      totalSessions: sessionsResult.rows.length,
      windowSeconds: ACTIVE_USER_WINDOW_SECONDS,
      generatedAt: new Date().toISOString(),
      users,
    });
  } catch (error) {
    console.error('[Presence] Erro ao listar usuários ativos:', error);
    res.status(500).json({ error: 'Erro ao carregar usuários ativos.' });
  }
});

// Configurações de Perfil
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM user_profiles WHERE id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

app.get('/api/profile/full', authenticateToken, async (req, res) => {
  try {
    const profile = await query(
      `SELECT up.*, ug.name as group_name 
       FROM user_profiles up
       LEFT JOIN user_groups ug ON up.group_id = ug.id
       WHERE up.id = $1`,
      [req.user.id]
    );

    const permissions = await query(
      `SELECT p.code 
       FROM user_profiles up
       JOIN group_permissions gp ON up.group_id = gp.group_id
       JOIN permissions p ON gp.permission_id = p.id
       WHERE up.id = $1`,
      [req.user.id]
    );

    res.json({
      ...(profile.rows[0] || {}),
      permission_codes: permissions.rows.map(r => r.code)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil completo' });
  }
});

app.get('/api/uploads/public/:token/:storedName', async (req, res) => {
  try {
    const { token, storedName } = req.params;
    const result = await query(
      `SELECT *
       FROM user_uploaded_files
       WHERE public_token = $1
         AND stored_name = $2
         AND deleted_at IS NULL
       LIMIT 1`,
      [token, storedName]
    );

    const file = result.rows[0];
    if (!file) {
      return res.status(404).send('Arquivo não encontrado.');
    }

    res.setHeader('Content-Type', file.mime_type);

    if (file.storage_path && fs.existsSync(file.storage_path)) {
      return res.sendFile(file.storage_path);
    }

    if (file.file_blob) {
      return res.send(Buffer.from(file.file_blob));
    }

    return res.status(404).json({
      success: false,
      error: `ENOENT: no such file or directory, stat '${file.storage_path}'`,
      code: 'ENOENT',
      source: 'database',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  } catch (error) {
    return res.status(500).send('Falha ao abrir arquivo.');
  }
});

app.get('/api/profile/limits', authenticateToken, async (req, res) => {
  try {
    const limits = await getEffectiveLimitSnapshot(req.user.id);
    return res.json(limits);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar limites do perfil.' });
  }
});

app.get('/api/files', authenticateToken, async (req, res) => {
  try {
    const baseUrl = buildRequestBaseUrl(req);
    const result = await query(
      `SELECT *
       FROM user_uploaded_files
       WHERE user_id = $1
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map((file) => formatUploadFileResponse(baseUrl, file)));
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar arquivos do usuário.' });
  }
});

app.post('/api/files/upload', authenticateToken, async (req, res) => {
  uploadMiddleware.array('files', 10)(req, res, async (uploadError) => {
    if (uploadError) {
      const status = uploadError?.code === 'LIMIT_FILE_SIZE' ? 400 : 400;
      const errorMessage =
        uploadError?.code === 'LIMIT_FILE_SIZE'
          ? 'Cada arquivo deve ter no máximo 50 MB.'
          : uploadError?.message || 'Falha no upload.';
      return res.status(status).json({ error: errorMessage });
    }

    try {
      const uploadedFiles = Array.isArray(req.files) ? req.files : [];
      if (uploadedFiles.length === 0) {
        return res.status(400).json({ error: 'Selecione ao menos um arquivo para upload.' });
      }

      const baseUrl = buildRequestBaseUrl(req);
      const limits = await getEffectiveLimitSnapshot(req.user.id);
      const currentUsage = Number(limits.uploads.usedBytes || 0);
      const batchSize = uploadedFiles.reduce((sum, file) => sum + Number(file.size || 0), 0);

      if (!limits.uploads.unlimited && limits.uploads.limitBytes != null && currentUsage + batchSize > limits.uploads.limitBytes) {
        uploadedFiles.forEach((file) => safeUnlink(file.path));
        return res.status(400).json({ error: 'O upload excede o limite disponível da sua conta.' });
      }

      const created = [];
      for (const file of uploadedFiles) {
        const rule = resolveFileRule(file.mimetype, file.originalname);
        if (!rule) {
          safeUnlink(file.path);
          continue;
        }

        const normalizedOriginalName = normalizeUploadDisplayName(file.originalname);

        const filePath = file.path || buildStoredFilePath(req.user.id, file.filename);
        const fileBuffer = fs.readFileSync(filePath);

        const insert = await query(
          `INSERT INTO user_uploaded_files (
            user_id,
            original_name,
            stored_name,
            mime_type,
            extension,
            media_type,
            size_bytes,
            storage_path,
            public_token,
            file_blob
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          ) RETURNING *`,
          [
            req.user.id,
            normalizedOriginalName,
            file.filename,
            file.mimetype,
            normalizedOriginalName.slice(normalizedOriginalName.lastIndexOf('.')).toLowerCase(),
            rule.mediaType,
            Number(file.size || 0),
            filePath,
            buildPublicFileToken(),
            fileBuffer,
          ]
        );

        created.push(formatUploadFileResponse(baseUrl, insert.rows[0]));
      }

      return res.status(201).json({
        items: created,
        limits: await getEffectiveLimitSnapshot(req.user.id),
      });
    } catch (error) {
      const uploadedFiles = Array.isArray(req.files) ? req.files : [];
      uploadedFiles.forEach((file) => safeUnlink(file.path));
      return res.status(500).json({ error: 'Erro ao salvar upload no servidor.' });
    }
  });
});

app.delete('/api/files/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `UPDATE user_uploaded_files
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND user_id = $2
         AND deleted_at IS NULL
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    const file = result.rows[0];
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado.' });
    }

    safeUnlink(file.storage_path);
    return res.json({
      ok: true,
      limits: await getEffectiveLimitSnapshot(req.user.id),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover arquivo.' });
  }
});

app.post('/api/profile', authenticateToken, async (req, res) => {
  try {
    const {
      webhook_email_url,
      use_global_ai,
      ai_api_key,
      use_global_webhooks,
      evolution_url,
      evolution_apikey,
      evolution_instance,
      company_info
    } = req.body;

    await query(
      `INSERT INTO user_profiles (id, webhook_email_url, use_global_ai, ai_api_key, use_global_webhooks, evolution_url, evolution_apikey, evolution_instance, company_info) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       ON CONFLICT (id) DO UPDATE SET 
         webhook_email_url = EXCLUDED.webhook_email_url,
         use_global_ai = EXCLUDED.use_global_ai,
         ai_api_key = EXCLUDED.ai_api_key,
         use_global_webhooks = EXCLUDED.use_global_webhooks,
         evolution_url = EXCLUDED.evolution_url,
         evolution_apikey = EXCLUDED.evolution_apikey,
         evolution_instance = EXCLUDED.evolution_instance,
         company_info = EXCLUDED.company_info`,
      [req.user.id, webhook_email_url, use_global_ai, ai_api_key, use_global_webhooks, evolution_url, evolution_apikey, evolution_instance, company_info]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar perfil' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const {
      display_name,
      phone,
      use_global_ai,
      ai_api_key,
      evolution_url,
      evolution_apikey,
      evolution_instance,
      company_info,
      gemini_model,
      gemini_api_version,
      gemini_temperature,
      gemini_max_tokens,
      send_interval_min,
      send_interval_max,
    } = req.body;

    const fields = [];
    const values = [];
    let setClause = '';
    let count = 1;

    const addField = (col, val) => {
      if (val !== undefined) {
        setClause += `${col} = $${count++}, `;
        values.push(val);
      }
    };

    if (display_name !== undefined) {
      await query('UPDATE users SET name = $1 WHERE id = $2', [display_name, req.user.id]);
    }

    addField('use_global_ai', use_global_ai);
    addField('ai_api_key', ai_api_key);
    addField('evolution_url', evolution_url);
    addField('evolution_apikey', evolution_apikey);
    addField('evolution_instance', evolution_instance);
    addField('company_info', company_info);
    addField('display_name', display_name);
    addField('phone', phone);
    addField('gemini_model', gemini_model);
    addField('gemini_api_version', gemini_api_version);
    addField('gemini_temperature', gemini_temperature);
    addField('gemini_max_tokens', gemini_max_tokens);
    addField('send_interval_min', send_interval_min);
    addField('send_interval_max', send_interval_max);

    if (count === 1) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    setClause = setClause.slice(0, -2);
    values.push(req.user.id);

    await query('INSERT INTO user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [req.user.id]);

    await query(
      `UPDATE user_profiles SET ${setClause} WHERE id = $${count}`,
      values
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// --- CRUD: CAMPANHAS ---
app.get('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar campanhas' });
  }
});

app.post('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    const { name, status, channels, list_name, message, variations, interval_min_seconds, interval_max_seconds, delivery_payload } = req.body;
    const parsedChannels = parseCampaignChannels(channels);
    const { payload: normalizedPayload, errors } = validateCampaignDeliveryPayload(delivery_payload, parsedChannels);

    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const result = await query(
      'INSERT INTO campaigns (user_id, name, status, channels, list_name, message, variations, interval_min_seconds, interval_max_seconds, delivery_payload) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [req.user.id, name, status || 'rascunho', parsedChannels, list_name, message, JSON.stringify(variations || []), interval_min_seconds || 30, interval_max_seconds || 90, normalizedPayload ? JSON.stringify(normalizedPayload) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    res.status(500).json({ error: 'Erro ao criar campanha' });
  }
});

app.put('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, channels, list_name, message, variations, interval_min_seconds, interval_max_seconds, delivery_payload } = req.body;
    const parsedChannels = parseCampaignChannels(channels);
    const { payload: normalizedPayload, errors } = validateCampaignDeliveryPayload(delivery_payload, parsedChannels);

    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const result = await query(
      'UPDATE campaigns SET name = $1, status = $2, channels = $3, list_name = $4, message = $5, variations = $6, interval_min_seconds = $7, interval_max_seconds = $8, delivery_payload = $9 WHERE id = $10 AND user_id = $11 RETURNING *',
      [name, status, parsedChannels, list_name, message, JSON.stringify(variations || []), interval_min_seconds, interval_max_seconds, normalizedPayload ? JSON.stringify(normalizedPayload) : null, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error);
    res.status(500).json({ error: 'Erro ao atualizar campanha' });
  }
});

app.delete('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM campaigns WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar campanha' });
  }
});

app.delete('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM campaigns WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resetar campanhas' });
  }
});

// --- CRUD: LISTAS ---
app.get('/api/lists', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM lists WHERE user_id = $1 ORDER BY name ASC', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar listas' });
  }
});

app.post('/api/lists', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const result = await query('INSERT INTO lists (user_id, name) VALUES ($1, $2) RETURNING *', [req.user.id, name]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar lista' });
  }
});

app.put('/api/lists/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await query(
      'UPDATE lists SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [name, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar lista' });
  }
});

app.delete('/api/lists/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM lists WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar lista' });
  }
});

app.delete('/api/lists', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM lists WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resetar listas' });
  }
});

// --- CRUD: CONTATOS ---
app.get('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.query;
    let sql = 'SELECT * FROM contacts WHERE user_id = $1';
    let params = [req.user.id];

    if (listId) {
      sql += ' AND list_id = $2';
      params.push(listId);
    }

    sql += ' ORDER BY name ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});// Importação Refatorada (Controller / Service / Repo)
import { ContactsController } from './controllers/contactsController.js';
import { errorHandler } from './middleware/errorMiddleware.js';

app.post('/api/contacts', authenticateToken, ContactsController.importSingle);

app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, category, cep, rating, address, city, state, instagram, facebook, whatsapp, website } = req.body;
    const result = await query(
      'UPDATE contacts SET name = $1, phone = $2, email = $3, category = $4, cep = $5, rating = $6, address = $7, city = $8, state = $9, instagram = $10, facebook = $11, whatsapp = $12, website = $13 WHERE id = $14 AND user_id = $15 RETURNING *',
      [name, phone, email, category, cep, rating, address, city, state, instagram, facebook, whatsapp, website, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
});

app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM contacts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar contato' });
  }
});

app.delete('/api/contacts', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM contacts WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resetar contatos' });
  }
});

// --- AGENDAMENTOS ---
app.get('/api/schedules', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT sj.*, c.name as campaign_name 
       FROM scheduled_jobs sj 
       JOIN campaigns c ON sj.campaign_id = c.id 
       WHERE c.user_id = $1 
       ORDER BY sj.scheduled_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

app.post('/api/schedules', authenticateToken, async (req, res) => {
  try {
    const { campaign_id, scheduled_at } = req.body;
    const result = await query(
      'INSERT INTO scheduled_jobs (campaign_id, scheduled_at) VALUES ($1, $2) RETURNING *',
      [campaign_id, scheduled_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// --- HISTÓRICO ---
app.post('/api/history', authenticateToken, async (req, res) => {
  try {
    await ensureContactSendHistoryTable();
    const {
      campaign_id,
      campaign_name,
      contact_name,
      phone_key,
      channel,
      ok,
      status,
      webhook_ok,
      run_at,
      provider_status,
      error_detail,
      payload_raw,
      delivery_summary,
    } = req.body;

    const result = await query(
      `INSERT INTO contact_send_history (
        user_id,
        campaign_id,
        campaign_name,
        contact_name,
        phone_key,
        channel,
        ok,
        status,
        webhook_ok,
        run_at,
        provider_status,
        error_detail,
        payload_raw,
        delivery_summary
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *`,
      [
        req.user.id,
        campaign_id,
        campaign_name || null,
        contact_name || '',
        phone_key || '',
        channel || 'whatsapp',
        Boolean(ok),
        Number(status || 0),
        webhook_ok ?? Boolean(ok),
        run_at || new Date().toISOString(),
        provider_status || null,
        error_detail || null,
        normalizeJsonbInput(payload_raw),
        normalizeJsonbInput(delivery_summary),
      ]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao salvar histÃ³rico de contato' });
  }
});

app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    await ensureContactSendHistoryTable();
    const result = await query(
      'SELECT * FROM contact_send_history WHERE user_id = $1 ORDER BY run_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico de contatos' });
  }
});

app.post('/api/history', authenticateToken, async (req, res) => {
  try {
    const {
      campaign_id,
      campaign_name,
      contact_name,
      phone_key,
      channel,
      ok,
      status,
      webhook_ok,
      run_at,
      provider_status,
      error_detail,
      payload_raw,
      delivery_summary,
    } = req.body;
    const result = await query(
      `INSERT INTO contact_send_history (
        user_id,
        campaign_id,
        campaign_name,
        contact_name,
        phone_key,
        channel,
        ok,
        status,
        webhook_ok,
        run_at,
        provider_status,
        error_detail,
        payload_raw,
        delivery_summary
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *`,
      [
        req.user.id,
        campaign_id,
        campaign_name || null,
        contact_name,
        phone_key,
        channel,
        ok,
        status,
        webhook_ok,
        run_at || new Date().toISOString(),
        provider_status || null,
        error_detail || null,
        normalizeJsonbInput(payload_raw),
        normalizeJsonbInput(delivery_summary),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar histórico de contato' });
  }
});

app.delete('/api/history', authenticateToken, async (req, res) => {
  try {
    await ensureContactSendHistoryTable();
    await query('DELETE FROM contact_send_history WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resetar histórico de contatos' });
  }
});

app.get('/api/campaigns/history', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM campaign_history WHERE user_id = $1 ORDER BY run_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico de campanhas' });
  }
});

app.post('/api/campaigns/history', authenticateToken, async (req, res) => {
  try {
    const { campaign_id, status, ok, total, error_count, run_at } = req.body;
    const result = await query(
      'INSERT INTO campaign_history (user_id, campaign_id, status, ok, total, error_count, run_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, campaign_id, status, ok, total, error_count, run_at || new Date().toISOString()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar histórico de campanha' });
  }
});

app.delete('/api/campaigns/history', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM campaign_history WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resetar histórico de campanhas' });
  }
});

// --- ENDPOINT PARA A EXTENSÃO CHROME ---
app.get('/api/extension/info', authenticateToken, async (req, res) => {
  try {
    console.log(`[Extension] Conexão recebida de: ${req.user.email}`);
    
    const listsResult = await query(
      'SELECT id, name FROM lists WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id]
    );

    console.log(`[Extension] Enviando ${listsResult.rows.length} listas para: ${req.user.email}`);
    
    res.json({
      ok: true,
      user: { id: req.user.id, email: req.user.email },
      lists: listsResult.rows,
    });
  } catch (error) {
    console.error('[Extension] Erro crítico ao buscar metadados para extensão:', error);
    res.status(500).json({ error: 'Erro ao buscar listas ou perfil', details: error.message });
  }
});

// Trata erros de body muito grande ou requisição abortada
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    console.error('Payload muito grande recebido em', req.path);
    return res.status(413).json({ error: 'Imagem muito grande. Tente uma foto com menor resolução.' });
  }
  if (err && err.type === 'request.aborted') {
    console.error('Requisição abortada em', req.path);
    return res.status(400).json({ error: 'Envio da imagem foi interrompido. Tente novamente.' });
  }
  return next(err);
});

// --- CONFIGURAÇÕES GLOBAIS ---
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM app_settings LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações globais' });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  try {
    const {
      global_ai_api_key,
      evolution_api_url,
      evolution_api_key,
      evolution_shared_instance,
      gemini_model,
      gemini_api_version,
      gemini_temperature,
      gemini_max_tokens,
      send_interval_min,
      send_interval_max,
      google_maps_api_key,
    } = req.body;

    const check = await query('SELECT id FROM app_settings LIMIT 1');

    let result;
    if (check.rows.length > 0) {
      result = await query(
        `UPDATE app_settings SET 
          global_ai_api_key = $1, 
          evolution_api_url = $2,
          evolution_api_key = $3,
          evolution_shared_instance = $4,
          gemini_model = $5,
          gemini_api_version = $6,
          gemini_temperature = $7,
          gemini_max_tokens = $8,
          send_interval_min = $9,
          send_interval_max = $10,
          google_maps_api_key = $11
         RETURNING *`,
        [global_ai_api_key, evolution_api_url, evolution_api_key, evolution_shared_instance,
          gemini_model, gemini_api_version, gemini_temperature, gemini_max_tokens,
          send_interval_min, send_interval_max, google_maps_api_key]
      );
    } else {
      result = await query(
        `INSERT INTO app_settings 
          (global_ai_api_key, evolution_api_url, evolution_api_key, evolution_shared_instance,
           gemini_model, gemini_api_version, gemini_temperature, gemini_max_tokens,
           send_interval_min, send_interval_max, google_maps_api_key) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [global_ai_api_key, evolution_api_url, evolution_api_key, evolution_shared_instance,
          gemini_model, gemini_api_version, gemini_temperature, gemini_max_tokens,
          send_interval_min, send_interval_max, google_maps_api_key]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao salvar configurações globais:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações globais', details: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'sendmessage-backend' });
});

// --- ENDPOINT DE MIGRATION (protegido por chave secreta) ---
app.post('/api/migrate', async (req, res) => {
  const secret = req.headers['x-migrate-key'];
  if (secret !== (process.env.MIGRATE_SECRET || 'sendmessage-migrate-2024')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    await runMigrations();
    res.json({ ok: true, message: 'Migration executada com sucesso.' });
  } catch (e) {
    res.status(500).json({ error: 'Falha na migration', details: e.message });
  }
});

// --- EXTRAÇÃO DO GOOGLE MAPS (Places API) ---

// Busca de estabelecimentos
app.post('/api/extract/maps/search', authenticateToken, async (req, res) => {
  try {
    const { query: searchTerm, location, radius = 10000 } = req.body;

    if (!searchTerm || !location) {
      return res.status(400).json({ error: 'query e location são obrigatórios' });
    }

    // Busca a chave da API nas configurações globais
    const settingsResult = await query('SELECT google_maps_api_key FROM app_settings LIMIT 1');
    const apiKey = settingsResult.rows[0]?.google_maps_api_key || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: 'Chave da Google Maps API não configurada. Acesse Configurações para adicionar.' });
    }

    // Text Search na Places API
    const searchQuery = encodeURIComponent(`${searchTerm} em ${location}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&language=pt-BR&region=br&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Maps] Erro Places API:', data.status, data.error_message);
      return res.status(400).json({ error: `Erro na API do Google Maps: ${data.status}`, details: data.error_message });
    }

    const places = (data.results || []).map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity || '',
      rating: place.rating || null,
      total_ratings: place.user_ratings_total || 0,
      category: place.types?.[0]?.replace(/_/g, ' ') || 'Estabelecimento',
      location: place.geometry?.location || null,
      // Dados detalhados vêm do endpoint de details
      phone: null,
      website: null,
    }));

    res.json({ places, nextPageToken: data.next_page_token || null });
  } catch (error) {
    console.error('[Maps] Erro ao buscar:', error);
    res.status(500).json({ error: 'Erro ao buscar no Google Maps', details: error.message });
  }
});

// Buscar mais resultados (paginação)
app.post('/api/extract/maps/next-page', authenticateToken, async (req, res) => {
  try {
    const { pageToken } = req.body;
    if (!pageToken) return res.status(400).json({ error: 'pageToken é obrigatório' });

    const settingsResult = await query('SELECT google_maps_api_key FROM app_settings LIMIT 1');
    const apiKey = settingsResult.rows[0]?.google_maps_api_key || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) return res.status(400).json({ error: 'Chave da Google Maps API não configurada.' });

    // Google exige 2s de espera para o próximo page token
    await new Promise(r => setTimeout(r, 2100));

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    const places = (data.results || []).map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity || '',
      rating: place.rating || null,
      total_ratings: place.user_ratings_total || 0,
      category: place.types?.[0]?.replace(/_/g, ' ') || 'Estabelecimento',
      location: place.geometry?.location || null,
      phone: null,
      website: null,
    }));

    res.json({ places, nextPageToken: data.next_page_token || null });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar próxima página', details: error.message });
  }
});

// Detalhes de um estabelecimento (telefone e site)
app.get('/api/extract/maps/details/:placeId', authenticateToken, async (req, res) => {
  try {
    const { placeId } = req.params;

    const settingsResult = await query('SELECT google_maps_api_key FROM app_settings LIMIT 1');
    const apiKey = settingsResult.rows[0]?.google_maps_api_key || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) return res.status(400).json({ error: 'Chave da Google Maps API não configurada.' });

    const fields = 'name,formatted_phone_number,international_phone_number,website,formatted_address,rating,types';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=pt-BR&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(400).json({ error: `Erro ao buscar detalhes: ${data.status}` });
    }

    const r = data.result;
    res.json({
      place_id: placeId,
      name: r.name,
      phone: r.international_phone_number || r.formatted_phone_number || null,
      phone_local: r.formatted_phone_number || null,
      website: r.website || null,
      address: r.formatted_address || null,
      rating: r.rating || null,
      category: r.types?.[0]?.replace(/_/g, ' ') || 'Estabelecimento',
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes do lugar', details: error.message });
  }
});

// Completar endereço a partir de CEP usando ViaCEP (sem IA)
app.post('/api/ai/address-from-cep', async (req, res) => {
  try {
    const { cep } = req.body || {};

    if (!cep || typeof cep !== 'string') {
      return res.status(400).json({ error: 'cep é obrigatório.' });
    }

    const cleanCep = String(cep).replace(/[^0-9]/g, '');
    if (cleanCep.length !== 8) {
      return res.status(400).json({ error: 'CEP inválido. Use formato 00000000 ou 00000-000.' });
    }

    const viaCepUrl = `https://viacep.com.br/ws/${cleanCep}/json/`;
    const response = await fetch(viaCepUrl);

    if (!response.ok) {
      const text = await response.text();
      console.error('Erro ViaCEP:', response.status, text);
      return res
        .status(500)
        .json({ error: 'Falha ao consultar ViaCEP.', status: response.status, details: text });
    }

    const data = await response.json();

    if (data.erro) {
      return res.status(404).json({ error: 'CEP não encontrado no ViaCEP.', cep: cleanCep });
    }

    const logradouro = (data.logradouro || '').trim();
    const bairro = (data.bairro || '').trim();
    const addressParts = [logradouro, bairro].filter(Boolean);
    const address = addressParts.join(' - ');
    const city = (data.localidade || '').trim();
    const state = (data.uf || '').trim();

    res.json({ ok: true, cep: cleanCep, address, city, state });
  } catch (error) {
    console.error('Erro em /api/ai/address-from-cep:', error);
    res
      .status(500)
      .json({ error: 'Falha ao completar endereço a partir do CEP (ViaCEP).', details: error.message });
  }
});

// Dispara uma campanha por ID usando n8n, baseado no schema lists/contacts do Postgres
app.post('/api/campaigns/:id/send', authenticateToken, async (req, res) => {
  try {
    const campaignId = req.params.id;
    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId é obrigatório.' });
    }

    const campaignResult = await query(
      'SELECT * FROM campaigns WHERE id = $1 AND user_id = $2',
      [campaignId, req.user.id]
    );
    const campaign = campaignResult.rows[0];

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    const listResult = await query(
      'SELECT id, name FROM lists WHERE user_id = $1 AND name = $2',
      [req.user.id, campaign.list_name]
    );
    const list = listResult.rows[0];

    if (!list) {
      return res.status(400).json({ error: 'Lista da campanha não encontrada.' });
    }

    const channels = Array.isArray(campaign.channels) ? campaign.channels : [];
    const { errors: payloadErrors } = validateCampaignDeliveryPayload(campaign.delivery_payload, channels);
    if (payloadErrors.length > 0) {
      return res.status(400).json({ error: payloadErrors[0] });
    }

    const contactsResult = await query(
      'SELECT id, name, phone, email, category, cep, address, city, rating FROM contacts WHERE user_id = $1 AND list_id = $2',
      [req.user.id, list.id]
    );
    const contacts = contactsResult.rows;

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'Lista não possui contatos para envio.' });
    }

    const profileResult = await query(
      'SELECT webhook_whatsapp_url, webhook_email_url, evolution_url, evolution_apikey, evolution_instance FROM user_profiles WHERE id = $1',
      [req.user.id]
    );
    const userProfile = profileResult.rows[0];
    const globalSettingsResult = await query('SELECT * FROM app_settings LIMIT 1');
    const globalSettings = globalSettingsResult.rows[0] || {};

    const evolutionUrl = (userProfile?.evolution_url || globalSettings.evolution_api_url || '').trim();
    const evolutionApiKey = (userProfile?.evolution_apikey || globalSettings.evolution_api_key || '').trim();
    const evolutionInstance = (userProfile?.evolution_instance || globalSettings.evolution_shared_instance || '').trim();
    const webhookUrlEmail = userProfile?.webhook_email_url || globalSettings.global_webhook_email_url || process.env.WEBHOOK_EMAIL || '';

    const effectiveChannels = channels.filter((ch) => {
      if (ch === 'whatsapp') {
        return !!evolutionUrl && !!evolutionApiKey && !!evolutionInstance;
      }
      return !!webhookUrlEmail.trim();
    });

    if (effectiveChannels.length === 0) {
      return res.status(400).json({
        error:
          'Nenhum serviço de envio configurado. Verifique as configurações da Evolution API para WhatsApp ou Webhook para Email.',
      });
    }

    const intervalMin = campaign.interval_min_seconds ?? 30;
    const intervalMax = campaign.interval_max_seconds ?? 90;
    let errors = 0;
    const items = [];

    for (const contact of contacts) {
      for (const channel of effectiveChannels) {
        if (channel === 'whatsapp') {
          const evolutionNumber = toEvolutionNumber(contact.phone);
          if (!evolutionNumber) {
            const invalidPhoneEntry = buildContactSendHistoryEntry({
              userId: req.user.id,
              campaign,
              contact,
              channel,
              error: new Error('Contato sem telefone válido para envio no formato Evolution.'),
            });
            await insertContactSendHistory(query, invalidPhoneEntry);
            items.push(invalidPhoneEntry);
            errors++;
            continue;
          }

          try {
            const deliveryResult = await executeWhatsappCampaignDelivery({
              evolutionUrl,
              evolutionApiKey,
              evolutionInstance,
              campaign,
              contact,
            });

            const historyEntry = buildContactSendHistoryEntry({
              userId: req.user.id,
              campaign,
              contact,
              channel,
              deliveryResult,
            });

            await insertContactSendHistory(query, historyEntry);
            items.push(historyEntry);

            if (historyEntry.status !== 200) {
              errors++;
            }
          } catch (sendError) {
            console.error(`[Evolution] Falha na requisição para ${evolutionNumber}:`, sendError?.message || sendError);
            const historyEntry = buildContactSendHistoryEntry({
              userId: req.user.id,
              campaign,
              contact,
              channel,
              error: sendError,
            });
            await insertContactSendHistory(query, historyEntry);
            items.push(historyEntry);
            errors++;
          }
        }

        if (channel === 'email') {
          console.warn(`[Email] Canal email não suportado nesta versão. Contato: ${contact.name}`);
        }
      }

      if (contact !== contacts[contacts.length - 1]) {
        const delaySeconds =
          intervalMin + Math.floor(Math.random() * Math.max(1, intervalMax - intervalMin + 1));
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    return res.json({ ok: true, campaignId, contactsCount: contacts.length, errors, items });
  } catch (error) {
    console.error('Erro em /api/campaigns/:id/send [structured-history]:', error);
    return res.status(500).json({ error: 'Falha ao enviar campanha.', details: error.message });
  }
});

app.post('/api/campaigns/:id/send', authenticateToken, async (req, res) => {
  try {
    const campaignId = req.params.id;
    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId é obrigatório.' });
    }

    // 1) Buscar campanha
    const campaignResult = await query(
      'SELECT * FROM campaigns WHERE id = $1 AND user_id = $2',
      [campaignId, req.user.id]
    );
    const campaign = campaignResult.rows[0];

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    // 2) Buscar lista pelo nome e user_id
    const listResult = await query(
      'SELECT id, name FROM lists WHERE user_id = $1 AND name = $2',
      [req.user.id, campaign.list_name]
    );
    const list = listResult.rows[0];

    if (!list) {
      return res.status(400).json({ error: 'Lista da campanha não encontrada.' });
    }

    const channels = Array.isArray(campaign.channels) ? campaign.channels : [];
    const { errors: payloadErrors } = validateCampaignDeliveryPayload(campaign.delivery_payload, channels);
    if (payloadErrors.length > 0) {
      return res.status(400).json({ error: payloadErrors[0] });
    }

    // 3) Buscar contatos da lista
    const contactsResult = await query(
      'SELECT id, name, phone, email, category, cep, address, city, rating FROM contacts WHERE user_id = $1 AND list_id = $2',
      [req.user.id, list.id]
    );
    const contacts = contactsResult.rows;

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'Lista não possui contatos para envio.' });
    }

    // 4) Buscar webhooks e configurações Evolution
    const profileResult = await query(
      'SELECT webhook_whatsapp_url, webhook_email_url, evolution_url, evolution_apikey, evolution_instance FROM user_profiles WHERE id = $1',
      [req.user.id]
    );
    const userProfile = profileResult.rows[0];

    // Buscar configurações globais de fallback
    const globalSettingsResult = await query('SELECT * FROM app_settings LIMIT 1');
    const globalSettings = globalSettingsResult.rows[0] || {};

    // Determinar configurações de WhatsApp (Prioridade: Usuário -> Global)
    const evolutionUrl = (userProfile?.evolution_url || globalSettings.evolution_api_url || '').trim();
    const evolutionApiKey = (userProfile?.evolution_apikey || globalSettings.evolution_api_key || '').trim();
    const evolutionInstance = (userProfile?.evolution_instance || globalSettings.evolution_shared_instance || '').trim();

    // Fallback para n8n apenas para Email
    const webhookUrlEmail = userProfile?.webhook_email_url || globalSettings.global_webhook_email_url || process.env.WEBHOOK_EMAIL || '';

    // 5) Determinar canais efetivos
    const effectiveChannels = channels.filter((ch) => {
      if (ch === 'whatsapp') {
        // Agora disparos de WhatsApp exigem Evolution API configurada
        return (!!evolutionUrl && !!evolutionApiKey && !!evolutionInstance);
      }
      return !!webhookUrlEmail.trim();
    });

    if (effectiveChannels.length === 0) {
      return res.status(400).json({
        error:
          'Nenhum serviço de envio configurado. Verifique as configurações da Evolution API para WhatsApp ou Webhook para Email.',
      });
    }

    const intervalMin = campaign.interval_min_seconds ?? 30;
    const intervalMax = campaign.interval_max_seconds ?? 90;

    const normalizePhone = (phone) => {
      const digits = (phone || '').replace(/\D/g, '');
      // Remove DDI 55 se presente para ter somente o número local (DDD + número)
      return digits.startsWith('55') ? digits.substring(2) : digits;
    };

    const toEvolutionNumber = (phone) => {
      const local = normalizePhone(phone);
      if (!local) return null;
      // Formato esperado pela Evolution API: 55 + DDD + número (sem @s.whatsapp.net)
      return `55${local}`;
    };

    const resolveTemplate = (tpl, contact) => {
      let result = tpl;
      const data = {
        '{name}': contact.name || '',
        '{primeiro_nome}': (contact.name || '').split(' ')[0],
        '{phone}': contact.phone || '',
        '{category}': contact.category || '',
        '{city}': contact.city || '',
        '{email}': contact.email || '',
        '{rating}': contact.rating || '',
      };

      Object.entries(data).forEach(([key, val]) => {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(escapedKey, 'g'), val);
      });
      return result;
    };

    const extractImages = (html) => {
      const images = [];
      const regex = /<img[^>]+src="([^">]+)"/gi;
      let match;
      while ((match = regex.exec(html)) !== null) {
        images.push(match[1]);
      }
      return images;
    };

    const decodeHtmlEntities = (value) =>
      String(value || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');

    const htmlToWhatsapp = (html) => {
      if (!html) return '';

      let text = html;

      // negrito
      text = text.replace(/<(b|strong)>([\s\S]*?)<\/(b|strong)>/gi, '*$2*');
      // itálico
      text = text.replace(/<(i|em)>([\s\S]*?)<\/(i|em)>/gi, '_$2_');
      // rasurado
      text = text.replace(/<(s|del)>([\s\S]*?)<\/(s|del)>/gi, '~$2~');
      
      // links
      text = text.replace(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/gi, (match, url, label) => {
        const cleanLabel = label.replace(/<[^>]+>/g, '').trim();
        const cleanUrl = url.replace(/^(mailto|https?|tel):/i, '').replace(/^\/\//, '').replace(/\/$/, '').trim();
        const cleanLabelCompare = cleanLabel.replace(/^(mailto|https?|tel):/i, '').replace(/^\/\//, '').replace(/\/$/, '').trim();
        
        if (cleanUrl === cleanLabelCompare || !cleanLabel) {
          return url.startsWith('mailto:') ? cleanLabel : url;
        }
        return `${cleanLabel} (${url})`;
      });

      // listas
      text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '* $1\n');
      text = text.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
      // parágrafos e quebras
      text = text.replace(/<br\s*\/?>/gi, '\n');
      text = text.replace(/<\/(p|div)>/gi, '\n');

      // remover demais tags e limpar
      return decodeHtmlEntities(text)
        .replace(/<[^>]+>/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };

    const htmlToText = (html) =>
      decodeHtmlEntities(html)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();

    const messageHtmlRaw = campaign.message || '';
    const messageHtml = messageHtmlRaw.trim().startsWith('<')
      ? messageHtmlRaw
      : `<p style="margin:0; font-size:14px; line-height:1.5; color:#111827;">${messageHtmlRaw
        .split('\n')
        .map((line) => (line.trim().length === 0 ? '&nbsp;' : line))
        .join('<br />')}</p>`;

    const messageText = htmlToText(messageHtml);

    let errors = 0;
    const items = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const contactIndex = i + 1;

      for (const channel of effectiveChannels) {
        if (channel === 'whatsapp') {
          const evolutionNumber = toEvolutionNumber(contact.phone);
          if (!evolutionNumber) {
            console.warn(`[Evolution] Contato sem telefone válido: ${contact.name}`);
            continue;
          }

          if (evolutionUrl && evolutionInstance) {
            try {
              const deliveryResult = await executeWhatsappCampaignDelivery({
                evolutionUrl,
                evolutionApiKey,
                evolutionInstance,
                campaign,
                contact,
              });

              if (deliveryResult.mediaFailed > 0 || deliveryResult.contactFailed) {
                errors++;
              }

              continue;

              const resolvedHtml = resolveTemplate(messageHtml, contact);
              const messageTextProcessed = htmlToWhatsapp(resolvedHtml);
              const imageUrls = extractImages(resolvedHtml);

              // 1) Enviar Texto
              if (messageTextProcessed) {
                const textUrl = `${evolutionUrl}/message/sendText/${evolutionInstance}`;
                const textBody = {
                  number: evolutionNumber,
                  text: messageTextProcessed,
                  linkPreview: true
                };

                console.log(`[Evolution] Enviando Texto para ${evolutionNumber} (${contact.name})`);
                const textResp = await fetch(textUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                  body: JSON.stringify(textBody),
                });

                if (!textResp.ok) {
                  const errText = await textResp.text();
                  console.error(`[Evolution] Erro no Texto para ${evolutionNumber}:`, errText);
                  errors++;
                }
              }

              // 2) Enviar Imagens (se houver)
              for (const imageUrl of imageUrls) {
                const mediaUrl = `${evolutionUrl}/message/sendMedia/${evolutionInstance}`;
                const mediaBody = {
                  number: evolutionNumber,
                  media: imageUrl,
                  mediatype: 'image',
                  caption: '' // Imagens enviadas separadamente para garantir entrega
                };

                console.log(`[Evolution] Enviando Imagem para ${evolutionNumber} (${contact.name}): ${imageUrl}`);
                const mediaResp = await fetch(mediaUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                  body: JSON.stringify(mediaBody),
                });

                if (!mediaResp.ok) {
                  const errMedia = await mediaResp.text();
                  console.error(`[Evolution] Erro na Imagem para ${evolutionNumber}:`, errMedia);
                  // Não somamos erro aqui para não invalidar o envio do texto que talvez tenha dado certo
                }
              }
            } catch (e) {
              console.error(`[Evolution] Falha na requisição para ${evolutionNumber}:`, e.message);
              errors++;
            }
          } else {
            console.warn('[Evolution] URL ou instance não configurados. Pulando envio WhatsApp.');
          }
        }

        if (channel === 'email') {
          // Email não está mais suportado sem integração externa.
          // Ignorar silenciosamente para não causar erros desnecessários.
          console.warn(`[Email] Canal email não suportado nesta versão. Contato: ${contact.name}`);
        }
      }

      if (i < contacts.length - 1) {
        const delaySeconds =
          intervalMin + Math.floor(Math.random() * Math.max(1, intervalMax - intervalMin + 1));
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    return res.json({ ok: true, campaignId, contactsCount: contacts.length, errors });
  } catch (error) {
    console.error('Erro em /api/campaigns/:id/send:', error);
    res.status(500).json({ error: 'Falha ao enviar campanha agendada.', details: error.message });
  }
});

// IA: extração de contato a partir de imagem usando Gemini
app.post('/api/ai/extract-contact', async (req, res) => {
  try {
    const { imageBase64, geminiApiKey } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'imageBase64 é obrigatório.' });
    }

    const keyData = await getActiveGeminiKey();
    const apiKey = keyData ? keyData.api_key : (geminiApiKey || process.env.GEMINI_API_KEY);
    
    if (!apiKey) {
      return res.status(400).json({ error: 'Nenhuma chave Gemini disponível.' });
    }

    const prompt = `Você é um extrator de dados de contato.
A partir da imagem enviada (fachada, cartão, cardápio, banner, foto de empresa),
identifique, se existirem:
- nome da empresa ou do estabelecimento
- telefone principal
- email
- site
- redes sociais (Instagram, Facebook, WhatsApp link)
- endereço completo (rua, número, bairro, cidade, estado/UF, CEP)
- cidade (apenas o nome da cidade)
- estado (apenas a sigla do estado/UF)

Retorne APENAS um JSON válido, sem texto extra, exatamente no formato:
{
  "name": string | null,
  "phone": string | null,
  "email": string | null,
  "category": string | null,
  "instagram": string | null,
  "facebook": string | null,
  "whatsapp": string | null,
  "website": string | null,
  "address": string | null,
  "city": string | null,
  "state": string | null
}`;

    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

    const aiRes = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ''),
                }
              }
            ]
          }
        ]
      }),
    });

    const data = await aiRes.json();
    
    if (keyData) {
      await incrementKeyUsage(keyData.id, 'extract-contact', 'JSON Extracted', aiRes.ok ? null : data, req.user.id, 'global-pool', keyData.nome || null);
    }

    if (!aiRes.ok) {
      return res.status(aiRes.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erro em extract-contact:', error);
    res.status(500).json({ error: 'Falha na extração de contato' });
  }
});

// Proxy Geral de IA com Rotação de Chaves
app.post('/api/ai/proxy', authenticateToken, async (req, res) => {
  try {
    const { prompt, model, apiVersion, systemInstruction, temperature, maxTokens } = req.body;

    const access = await resolveGeminiAccessForUser(req.user.id);
    if (!access.apiKey) {
      return res.status(503).json({
        error: 'Nenhuma chave Gemini disponível para este usuário. Configure uma chave global, uma chave pessoal no perfil ou uma chave ativa no painel administrativo.'
      });
    }

    const actualModel = normalizeGeminiModel(model);
    const actualApiVersion = resolveGeminiApiVersion(actualModel, apiVersion);
    const url = `https://generativelanguage.googleapis.com/${actualApiVersion}/models/${actualModel}:generateContent?key=${access.apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature || 0.7,
        maxOutputTokens: maxTokens || 2048,
      }
    };

    if (modelSupportsThinkingBudget(actualModel) && actualApiVersion === 'v1beta') {
      body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await parseJsonResponseSafe(aiRes);

    if (access.keyData?.id) {
      await incrementKeyUsage(access.keyData.id, 'proxy', 'AI Response', aiRes.ok ? null : data, req.user.id, access.source, access.keyData.nome || null);
    } else {
      const sourceLabel =
        access.source === 'legacy-global-settings'
          ? 'legacy_global_ai_api_key'
          : access.source === 'user-profile'
            ? 'user_ai_api_key'
            : access.source === 'environment'
              ? 'env_gemini_api_key'
              : null;

      await logGeminiUsage({
        userId: req.user.id,
        module: 'proxy',
        resultText: 'AI Response',
        error: aiRes.ok ? null : data,
        source: access.source,
        keyLabel: sourceLabel,
      });
    }

    if (!aiRes.ok) {
      return res.status(aiRes.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('[AI Proxy] Erro:', error);
    res.status(500).json({ error: 'Erro interno no serviço de IA.' });
  }
});

// --- PERMISSÕES E ADMIN ---

// Retorna as permissões do usuário logado
app.get('/api/permissions/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.code 
       FROM user_profiles up
       JOIN group_permissions gp ON up.group_id = gp.group_id
       JOIN permissions p ON gp.permission_id = p.id
       WHERE up.id = $1`,
      [req.user.id]
    );
    res.json(result.rows.map(r => r.code));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
});

// Listar todos os usuários (Admin)
app.get('/api/admin/users', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT up.*, ug.name as group_name, u.name as user_name, u.email
       FROM user_profiles up
       LEFT JOIN user_groups ug ON up.group_id = ug.id
       LEFT JOIN users u ON up.id = u.id
       ORDER BY COALESCE(up.display_name, u.name, u.email, up.id::text) ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

app.put('/api/admin/users/:id/profile', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, phone, email } = req.body;

    await query(
      `INSERT INTO user_profiles (id, display_name, phone)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         phone = EXCLUDED.phone`,
      [id, display_name ?? null, phone ?? null]
    );

    if (display_name !== undefined) {
      await query('UPDATE users SET name = $1 WHERE id = $2', [display_name || null, id]);
    }

    if (email !== undefined) {
      await query('UPDATE users SET email = $1 WHERE id = $2', [email || null, id]);
    }

    const result = await query(
      `SELECT up.*, ug.name as group_name, u.name as user_name, u.email
       FROM user_profiles up
       LEFT JOIN user_groups ug ON up.group_id = ug.id
       LEFT JOIN users u ON up.id = u.id
       WHERE up.id = $1`,
      [id]
    );

    res.json(result.rows[0] || { ok: true });
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil do usuário' });
  }
});

// Listar todos os grupos (Admin)
app.get('/api/admin/groups', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const result = await query('SELECT * FROM user_groups ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar grupos' });
  }
});

// Listar todas as permissões (Admin)
app.get('/api/admin/permissions', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const result = await query('SELECT * FROM permissions ORDER BY code ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
});

// Listar todas as relações grupo-permissão (Admin)
app.get('/api/admin/group-permissions', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const result = await query('SELECT * FROM group_permissions');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar permissões de grupos' });
  }
});

// Atualizar grupo de um usuário (Admin)
app.put('/api/admin/users/:id/group', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { group_id } = req.body;
    await query('UPDATE user_profiles SET group_id = $1 WHERE id = $2', [group_id, id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar grupo do usuário' });
  }
});

// Atualizar configurações de um usuário (Admin)
app.put('/api/admin/users/:id/settings', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const allowedFields = ['use_global_ai', 'display_name', 'evolution_url', 'evolution_apikey', 'evolution_instance', 'company_info'];

    let queryText = 'UPDATE user_profiles SET ';
    const queryValues = [];
    let count = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        queryText += `${key} = $${count}, `;
        queryValues.push(value);
        count++;
      }
    }

    if (queryValues.length === 0) return res.status(400).json({ error: 'Nenhum campo válido fornecido' });

    queryText = queryText.slice(0, -2); // Remove last comma
    queryText += ` WHERE id = $${count}`;
    queryValues.push(id);

    await query(queryText, queryValues);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configurações do usuário' });
  }
});

app.post('/api/admin/users/:id/reset-password', authenticateToken, checkAdmin, resetUserPasswordToDefault);

app.post('/api/admin/users/:id/notify', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    const [targetUserResult, adminProfileResult, globalSettingsResult] = await Promise.all([
      query(
        `SELECT up.phone, COALESCE(up.display_name, u.name, u.email) AS user_label
         FROM user_profiles up
         LEFT JOIN users u ON up.id = u.id
         WHERE up.id = $1`,
        [id]
      ),
      query(
        'SELECT evolution_url, evolution_apikey, evolution_instance FROM user_profiles WHERE id = $1',
        [req.user.id]
      ),
      query(
        'SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM app_settings ORDER BY id DESC LIMIT 1'
      ),
    ]);

    const targetUser = targetUserResult.rows[0];
    if (!targetUser?.phone) {
      return res.status(400).json({ error: 'Usuário alvo não possui telefone cadastrado' });
    }

    const adminProfile = adminProfileResult.rows[0] || {};
    const globalSettings = globalSettingsResult.rows[0] || {};

    const evolutionUrl = (adminProfile.evolution_url || globalSettings.evolution_api_url || '').trim();
    const evolutionApiKey = (adminProfile.evolution_apikey || globalSettings.evolution_api_key || '').trim();
    const evolutionInstance = (adminProfile.evolution_instance || globalSettings.evolution_shared_instance || '').trim();

    if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
      return res.status(400).json({ error: 'Evolution API não configurada para notificações administrativas' });
    }

    const evolutionNumber = toEvolutionNumber(targetUser.phone);
    if (!evolutionNumber) {
      return res.status(400).json({ error: 'Telefone do usuário está em formato inválido' });
    }

    const response = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: evolutionApiKey,
      },
      body: JSON.stringify({
        number: evolutionNumber,
        text: String(message).trim(),
        linkPreview: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ error: `Falha ao enviar pela Evolution API: ${errorText}` });
    }

    res.json({ ok: true, target: targetUser.user_label || id });
  } catch (error) {
    console.error('Erro ao enviar notificação administrativa:', error);
    res.status(500).json({ error: 'Erro ao enviar notificação ao usuário' });
  }
});

// --- GESTÃO DE CHAVES GEMINI ---

app.get('/api/admin/gemini-keys', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const result = await query('SELECT id, nome, status, ultimo_uso, requests_count, data_cadastro, observacoes FROM gemini_api_keys ORDER BY data_cadastro DESC');
    const server = await getServerClock();
    res.json({ success: true, data: result.rows, server });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar chaves Gemini' });
  }
});

app.post('/api/admin/gemini-keys', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { nome, api_key, status, observacoes } = req.body;
    
    if (!nome || !api_key) {
      return res.status(400).json({ success: false, error: 'Nome e chave de API são obrigatórios' });
    }

    console.log('Tentando cadastrar chave Gemini:', { nome, status, userId: req.user?.id });
    const result = await query(
      'INSERT INTO gemini_api_keys (user_id, nome, api_key, status, observacoes) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, status',
      [req.user.id, nome, api_key, status || 'ativa', observacoes || null]
    );
    console.log('Chave Gemini cadastrada com sucesso:', result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro detalhado ao cadastrar chave Gemini:', error);
    res.status(500).json({ success: false, error: 'Erro ao cadastrar chave Gemini', detail: error.message });
  }
});

app.delete('/api/admin/gemini-keys/:id', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM gemini_api_keys WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao deletar chave Gemini' });
  }
});

app.post('/api/admin/gemini-keys/reset', authenticateToken, checkAdmin, async (req, res) => {
  try {
    await query('UPDATE gemini_api_keys SET requests_count = 0, status = CASE WHEN status = \'limite_atingido\' THEN \'ativa\' ELSE status END');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao resetar contadores Gemini' });
  }
});

// --- OPERAÇÕES DE AGENDAMENTO E FILA ---

app.post('/api/campaigns/:id/schedule', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data_inicio, hora_inicio, limite_diario, intervalo_minimo, intervalo_maximo, mensagens_por_lote, tempo_pausa_lote } = req.body;
    const systemNow = getSystemDateTimeParts();

    const campaignResult = await query(
      'SELECT id, user_id, name, list_name, channels, delivery_payload FROM campaigns WHERE id = $1 LIMIT 1',
      [id]
    );
    const campaign = campaignResult.rows[0];

    if (!campaign || campaign.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Campanha não encontrada para este usuário.' });
    }

    const channels = parseCampaignChannels(campaign.channels);
    if (!channels.includes('whatsapp')) {
      return res.status(400).json({
        error: 'O agendamento profissional exige o canal WhatsApp ativo nesta campanha.'
      });
    }

    const { errors: payloadErrors } = validateCampaignDeliveryPayload(campaign.delivery_payload, channels);
    if (payloadErrors.length > 0) {
      return res.status(400).json({ error: payloadErrors[0] });
    }

    const evolutionConfig = await resolveEvolutionConfigForUser(req.user.id);
    if (!evolutionConfig.evolutionUrl || !evolutionConfig.evolutionApiKey || !evolutionConfig.evolutionInstance) {
      return res.status(400).json({
        error: 'A Evolution API não está configurada para este usuário. Ajuste em Meu perfil ou em Configurações globais antes de agendar.'
      });
    }

    const listResult = await query(
      'SELECT id FROM lists WHERE user_id = $1 AND name = $2 LIMIT 1',
      [req.user.id, campaign.list_name]
    );
    const list = listResult.rows[0];

    if (!list) {
      return res.status(400).json({
        error: 'A lista vinculada a esta campanha nÃ£o foi encontrada.'
      });
    }

    const contactsCheck = await query(
      `SELECT COUNT(*)::int AS total
       FROM contacts
       WHERE user_id = $1
         AND list_id = $2
         AND COALESCE(TRIM(phone), '') <> ''`,
      [req.user.id, list.id]
    );

    if (!Number(contactsCheck.rows[0]?.total || 0)) {
      return res.status(400).json({
        error: 'Não há contatos ativos com telefone válido na lista desta campanha para agendar o envio.'
      });
    }

    const parsedDateTime = new Date(`${data_inicio || systemNow.date}T${hora_inicio || systemNow.timeShort}:00`);
    if (Number.isNaN(parsedDateTime.getTime())) {
      return res.status(400).json({ error: 'Data ou hora de início inválida.' });
    }

    if (Number(intervalo_minimo) <= 0 || Number(intervalo_maximo) <= 0) {
      return res.status(400).json({ error: 'Os intervalos mínimo e máximo devem ser maiores que zero.' });
    }

    if (Number(intervalo_minimo) > Number(intervalo_maximo)) {
      return res.status(400).json({ error: 'O intervalo mínimo não pode ser maior que o máximo.' });
    }

    if (Number(mensagens_por_lote) <= 0 || Number(tempo_pausa_lote) < 0 || Number(limite_diario) <= 0) {
      return res.status(400).json({ error: 'Revise lote, pausa e limite diário antes de agendar.' });
    }

    // Cancela agendamentos anteriores da mesma campanha e limpa pendências antigas para evitar reenvio indevido
    await query('UPDATE campaign_schedule SET status = \'cancelado\' WHERE campaign_id = $1 AND status = ANY($2)', [id, ['agendado', 'preparando', 'em_execucao', 'pausado']]);
    await query('DELETE FROM message_queue WHERE campaign_id = $1 AND status = $2', [id, 'pendente']);

    const result = await query(
      'INSERT INTO campaign_schedule (campaign_id, user_id, data_inicio, hora_inicio, limite_diario, intervalo_minimo, intervalo_maximo, mensagens_por_lote, tempo_pausa_lote) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, req.user.id, data_inicio || systemNow.date, hora_inicio || systemNow.time, limite_diario || 300, intervalo_minimo || 30, intervalo_maximo || 90, mensagens_por_lote || 45, tempo_pausa_lote || 15]
    );
    
    // Atualiza status da campanha
    await query('UPDATE campaigns SET status = \'agendada\', last_scheduled_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao agendar campanha:', error);
    res.status(500).json({ error: 'Erro ao agendar campanha' });
  }
});

app.get('/api/admin/operational-stats', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const stats = {
      enviadas_hoje: 0,
      enviadas_ultima_hora: 0,
      fila_pendente: 0,
      falhas_hoje: 0,
      campanhas_em_execucao: 0,
      ai: {
        requestsToday: 0,
        activeKeys: 0,
        poolRequestsToday: 0,
        globalRequestsToday: 0,
        legacyGlobalRequestsToday: 0,
        userRequestsToday: 0,
        environmentRequestsToday: 0,
      }
    };

    const resHoje = await query("SELECT count(*) FROM message_queue WHERE status = 'enviado' AND data_envio >= CURRENT_DATE");
    stats.enviadas_hoje = parseInt(resHoje.rows[0].count);

    const resHora = await query("SELECT count(*) FROM message_queue WHERE status = 'enviado' AND data_envio >= (NOW() - INTERVAL '1 hour')");
    stats.enviadas_ultima_hora = parseInt(resHora.rows[0].count);

    const resFila = await query("SELECT count(*) FROM message_queue WHERE status = 'pendente'");
    stats.fila_pendente = parseInt(resFila.rows[0].count);

    const resFalhas = await query("SELECT count(*) FROM message_queue WHERE status = 'falhou' AND data_criacao >= CURRENT_DATE");
    stats.falhas_hoje = parseInt(resFalhas.rows[0].count);

    const resExec = await query("SELECT count(*) FROM campaign_schedule WHERE status = 'em_execucao'");
    stats.campanhas_em_execucao = parseInt(resExec.rows[0].count);

    // Stats de IA
    const resAik = await query("SELECT count(*) FROM gemini_api_keys WHERE status = 'ativa'");
    stats.ai.activeKeys = parseInt(resAik.rows[0].count);
    
    const resAiu = await query(
      `SELECT
         COUNT(*)::int AS requests_today,
         COUNT(*) FILTER (WHERE source IN ('admin-pool', 'global-pool'))::int AS global_pool_requests_today,
         COUNT(*) FILTER (WHERE source = 'legacy-global-settings')::int AS legacy_global_requests_today,
         COUNT(*) FILTER (WHERE source = 'user-profile')::int AS user_requests_today,
         COUNT(*) FILTER (WHERE source = 'environment')::int AS environment_requests_today
       FROM gemini_api_usage_logs
       WHERE data_solicitacao >= CURRENT_DATE`
    );

    stats.ai.requestsToday = parseInt(resAiu.rows[0]?.requests_today || 0);
    stats.ai.poolRequestsToday = parseInt(resAiu.rows[0]?.global_pool_requests_today || 0);
    stats.ai.globalRequestsToday = parseInt(resAiu.rows[0]?.global_pool_requests_today || 0);
    stats.ai.legacyGlobalRequestsToday = parseInt(resAiu.rows[0]?.legacy_global_requests_today || 0);
    stats.ai.userRequestsToday = parseInt(resAiu.rows[0]?.user_requests_today || 0);
    stats.ai.environmentRequestsToday = parseInt(resAiu.rows[0]?.environment_requests_today || 0);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[AdminStats] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas operacionais' });
  }
});

app.delete('/api/campaigns/:id/schedule', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const campaignResult = await query(
      'SELECT id, user_id FROM campaigns WHERE id = $1 LIMIT 1',
      [id]
    );
    const campaign = campaignResult.rows[0];

    if (!campaign || campaign.user_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Campanha não encontrada para este usuário.' });
    }

    await query('DELETE FROM message_queue WHERE campaign_id = $1 AND status = $2', [id, 'pendente']);
    await query(
      `UPDATE message_queue
       SET status = 'falhou',
           erro = 'Envio cancelado pelo usuário antes da conclusão.',
           processing_started_at = NULL
       WHERE campaign_id = $1 AND status = 'processando'`,
      [id]
    );
    await query(
      `UPDATE campaign_schedule
       SET status = 'cancelado',
           pause_reason = 'manual_cancel',
           pause_details = 'Agendamento cancelado manualmente pelo usuário.',
           paused_at = COALESCE(paused_at, NOW())
       WHERE campaign_id = $1
         AND status = ANY($2)`,
      [id, ['agendado', 'preparando', 'em_execucao', 'pausado']]
    );
    await syncCampaignStatusFromQueue(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao cancelar agendamento' });
  }
});

app.get('/api/schedules/professional', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdminUser(req.user.id);
    const params = [];
    let whereClause = "WHERE s.status = ANY($1)";

    params.push(['agendado', 'preparando', 'em_execucao', 'pausado']);

    if (!admin) {
      params.push(req.user.id);
      whereClause += ' AND s.user_id = $2';
    }

    const resSched = await query(
      `SELECT s.*, c.name as campaign_name,
              COALESCE((
                SELECT COUNT(*)::int
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND mq.status = 'pendente'
              ), 0) AS pending_count,
              COALESCE((
                SELECT COUNT(*)::int
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND mq.status = 'processando'
              ), 0) AS processing_count,
              COALESCE((
                SELECT COUNT(*)::int
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND mq.status = 'enviado'
              ), 0) AS sent_count,
              COALESCE((
                SELECT COUNT(*)::int
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND mq.status = 'falhou'
              ), 0) AS failed_count,
              (
                SELECT mq.erro
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND COALESCE(TRIM(mq.erro), '') <> ''
                ORDER BY COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao) DESC
                LIMIT 1
              ) AS last_error,
              (
                SELECT COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao)
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                ORDER BY COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao) DESC
                LIMIT 1
              ) AS last_queue_activity_at,
              (
                SELECT l.event
                FROM scheduler_logs l
                WHERE CASE
                  WHEN l.details ~ '^\\s*\\{' THEN (l.details::jsonb->>'schedule_id')::integer
                  ELSE NULL
                END = s.id
                ORDER BY l.data_evento DESC
                LIMIT 1
              ) AS last_event,
              (
                SELECT l.data_evento
                FROM scheduler_logs l
                WHERE CASE
                  WHEN l.details ~ '^\\s*\\{' THEN (l.details::jsonb->>'schedule_id')::integer
                  ELSE NULL
                END = s.id
                ORDER BY l.data_evento DESC
                LIMIT 1
              ) AS last_event_at
       FROM campaign_schedule s
       LEFT JOIN campaigns c ON s.campaign_id = c.id
       ${whereClause}
       ORDER BY s.data_criacao DESC`,
      params
    );

    const server = await getServerClock();
    res.json({ success: true, data: resSched.rows, server });
  } catch (error) {
    console.error('[Schedules] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar agendamentos profissionais' });
  }
});

app.post('/api/schedules/professional/refresh', authenticateToken, async (req, res) => {
  try {
    const { runScheduler, runWorker, runCleanup } = await import('./queueWorker.js');
    await runScheduler();
    await runWorker();
    await runCleanup();

    const server = await getServerClock();
    res.json({ success: true, server });
  } catch (error) {
    console.error('[SchedulesRefresh] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar os agendamentos agora' });
  }
});

app.get('/api/schedules/history', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdminUser(req.user.id);
    const requestedStatus = String(req.query.status || 'all').trim().toLowerCase();
    const historyStatuses = ['concluido', 'cancelado', 'erro'];
    const filteredStatuses = requestedStatus === 'all'
      ? historyStatuses
      : historyStatuses.filter((status) => status === requestedStatus);

    if (filteredStatuses.length === 0) {
      return res.status(400).json({ success: false, error: 'Filtro de histórico inválido.' });
    }

    const params = [filteredStatuses];
    let whereClause = 'WHERE s.status = ANY($1)';

    if (!admin) {
      params.push(req.user.id);
      whereClause += ' AND s.user_id = $2';
    }

    const result = await query(
      `SELECT s.*, c.name as campaign_name,
              COALESCE((
                SELECT COUNT(*)::int
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND mq.status = 'pendente'
              ), 0) AS pending_count,
              COALESCE((
                SELECT COUNT(*)::int
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND mq.status = 'processando'
              ), 0) AS processing_count,
              COALESCE((
                SELECT COUNT(*)::int
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND mq.status = 'enviado'
              ), 0) AS sent_count,
              COALESCE((
                SELECT COUNT(*)::int
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND mq.status = 'falhou'
              ), 0) AS failed_count,
              (
                SELECT mq.erro
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                  AND COALESCE(TRIM(mq.erro), '') <> ''
                ORDER BY COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao) DESC
                LIMIT 1
              ) AS last_error,
              (
                SELECT COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao)
                FROM message_queue mq
                WHERE mq.schedule_id = s.id
                ORDER BY COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao) DESC
                LIMIT 1
              ) AS last_queue_activity_at,
              (
                SELECT l.event
                FROM scheduler_logs l
                WHERE CASE
                  WHEN l.details ~ '^\\s*\\{' THEN (l.details::jsonb->>'schedule_id')::integer
                  ELSE NULL
                END = s.id
                ORDER BY l.data_evento DESC
                LIMIT 1
              ) AS last_event,
              (
                SELECT l.data_evento
                FROM scheduler_logs l
                WHERE CASE
                  WHEN l.details ~ '^\\s*\\{' THEN (l.details::jsonb->>'schedule_id')::integer
                  ELSE NULL
                END = s.id
                ORDER BY l.data_evento DESC
                LIMIT 1
              ) AS last_event_at
       FROM campaign_schedule s
       LEFT JOIN campaigns c ON s.campaign_id = c.id
       ${whereClause}
       ORDER BY COALESCE(s.resumed_at, s.paused_at, s.data_criacao) DESC
       LIMIT 100`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[ScheduleHistory] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar histórico de agendamentos' });
  }
});

app.get('/api/queue/professional', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdminUser(req.user.id);
    const params = [];
    let whereClause = '';

    if (!admin) {
      params.push(req.user.id);
      whereClause = 'WHERE q.user_id = $1';
    }

    const resQueue = await query(
      `SELECT q.*, c.name as campaign_name,
              (SELECT json_agg(l.*) FROM scheduler_logs l
               WHERE CASE
                 WHEN l.details ~ '^\\s*\\{' THEN (l.details::jsonb->>'message_id')::integer
                 ELSE NULL
               END = q.id
               AND l.event IN ('zombie_recovered', 'zombie_failed')) as recovery_logs
       FROM message_queue q
       LEFT JOIN campaigns c ON q.campaign_id = c.id
       ${whereClause}
       ORDER BY q.data_criacao DESC
       LIMIT 100`,
      params
    );

    const server = await getServerClock();
    res.json({ success: true, data: resQueue.rows, server });
  } catch (error) {
    console.error('[Queue] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar fila de mensagens' });
  }
});

app.get('/api/admin/schedules', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const resSched = await query(`
      SELECT s.*, c.name as campaign_name 
      FROM campaign_schedule s
      LEFT JOIN campaigns c ON s.campaign_id = c.id
      ORDER BY s.data_criacao DESC
    `);
    res.json({ success: true, data: resSched.rows });
  } catch (error) {
    console.error('[AdminSchedules] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar agendamentos profissionais' });
  }
});

app.get('/api/admin/queue', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const resQueue = await query(`
      SELECT q.*, c.name as campaign_name,
              (SELECT json_agg(l.*) FROM scheduler_logs l 
               WHERE CASE
                 WHEN l.details ~ '^\\s*\\{' THEN (l.details::jsonb->>'message_id')::integer
                 ELSE NULL
               END = q.id
               AND l.event IN ('zombie_recovered', 'zombie_failed')) as recovery_logs
      FROM message_queue q
      LEFT JOIN campaigns c ON q.campaign_id = c.id
      ORDER BY q.data_criacao DESC
      LIMIT 100
    `);
    res.json({ success: true, data: resQueue.rows });
  } catch (error) {
    console.error('[AdminQueue] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar fila de mensagens' });
  }
});

// Remover permissão de um grupo (Admin)
app.delete('/api/admin/group-permissions', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { group_id, permission_id } = req.body;
    await query('DELETE FROM group_permissions WHERE group_id = $1 AND permission_id = $2', [group_id, permission_id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover permissão do grupo' });
  }
});


// --- AUTO-MIGRATION: roda na inicialização para garantir schema atualizado ---
async function runMigrations() {
  const migrations = [
    // app_settings: colunas de IA e intervalos
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS gemini_model TEXT DEFAULT 'gemini-2.5-flash'`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS gemini_api_version TEXT DEFAULT 'v1'`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS gemini_temperature NUMERIC(3,2) DEFAULT 0.7`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS gemini_max_tokens INTEGER DEFAULT 1024`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS send_interval_min INTEGER DEFAULT 30`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS send_interval_max INTEGER DEFAULT 90`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS google_maps_api_key TEXT`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS global_ai_api_key TEXT`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS evolution_api_url TEXT`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS evolution_api_key TEXT`,
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS evolution_shared_instance TEXT`,
    // user_profiles: colunas de IA, Evolution e intervalos
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ai_api_key TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS evolution_url TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS evolution_apikey TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS evolution_instance TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_info TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gemini_model TEXT DEFAULT 'gemini-2.5-flash'`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gemini_api_version TEXT DEFAULT 'v1'`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gemini_temperature NUMERIC(3,2) DEFAULT 0.7`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gemini_max_tokens INTEGER DEFAULT 1024`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS send_interval_min INTEGER DEFAULT 30`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS send_interval_max INTEGER DEFAULT 90`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS daily_message_limit INTEGER`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS monthly_message_limit INTEGER`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS upload_quota_bytes BIGINT`,
    // app_settings: garantir que a tabela exista mesmo que nunca tenha sido criada
    `CREATE TABLE IF NOT EXISTS app_settings (
      id SERIAL PRIMARY KEY,
      global_ai_api_key TEXT,
      evolution_api_url TEXT,
      evolution_api_key TEXT,
      evolution_shared_instance TEXT,
      gemini_model TEXT DEFAULT 'gemini-2.5-flash',
      gemini_api_version TEXT DEFAULT 'v1',
      gemini_temperature NUMERIC(3,2) DEFAULT 0.7,
      gemini_max_tokens INTEGER DEFAULT 1024,
      default_daily_message_limit INTEGER DEFAULT 300,
      default_monthly_message_limit INTEGER DEFAULT 9000,
      default_upload_quota_bytes BIGINT DEFAULT 104857600,
      global_gemini_daily_limit INTEGER DEFAULT 5000,
      send_interval_min INTEGER DEFAULT 30,
      send_interval_max INTEGER DEFAULT 90,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    // Nova arquitetura: Agendamento, Fila e APIs Gemini
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
    // Nova arquitetura: Agendamento, Fila e APIs Gemini com tipos UUID corrigidos
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
    // Correção de tipos (migração forçada se necessário)
    `DO $$ 
     BEGIN 
       IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_schedule' AND column_name='campaign_id' AND data_type='integer') THEN
         DROP TABLE IF EXISTS campaign_schedule CASCADE;
         DROP TABLE IF EXISTS message_queue CASCADE;
       END IF;
     END $$;`,
    `CREATE TABLE IF NOT EXISTS campaign_schedule (
      id SERIAL PRIMARY KEY,
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data_inicio DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      limite_diario INTEGER DEFAULT 300,
      intervalo_minimo INTEGER DEFAULT 30,
      intervalo_maximo INTEGER DEFAULT 90,
      mensagens_por_lote INTEGER DEFAULT 45,
      tempo_pausa_lote INTEGER DEFAULT 15,
      status TEXT DEFAULT 'agendado',
      scheduler_claimed_at TIMESTAMP WITH TIME ZONE,
      pause_reason TEXT,
      pause_details TEXT,
      paused_at TIMESTAMP WITH TIME ZONE,
      resumed_at TIMESTAMP WITH TIME ZONE,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
      `CREATE TABLE IF NOT EXISTS message_queue (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER REFERENCES campaign_schedule(id) ON DELETE CASCADE,
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contact_id TEXT,
        telefone TEXT NOT NULL,
        nome TEXT,
        mensagem TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
      tentativas INTEGER DEFAULT 0,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      data_envio TIMESTAMP WITH TIME ZONE,
      processing_started_at TIMESTAMP WITH TIME ZONE,
      recovered_at TIMESTAMP WITH TIME ZONE,
      erro TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_mq_user_status ON message_queue(user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_mq_schedule_status ON message_queue(schedule_id, status)`,
    `CREATE TABLE IF NOT EXISTS gemini_api_keys (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      api_key TEXT NOT NULL,
      status TEXT DEFAULT 'ativa',
      ultimo_uso TIMESTAMP WITH TIME ZONE,
      requests_count INTEGER DEFAULT 0,
      data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      observacoes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS gemini_api_usage_logs (
      id SERIAL PRIMARY KEY,
      key_id INTEGER,
      user_id UUID,
      module TEXT,
      resultado TEXT,
      erro TEXT,
      source TEXT DEFAULT 'global-pool',
      key_label TEXT,
      data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE gemini_api_usage_logs ALTER COLUMN key_id DROP NOT NULL`,
    `ALTER TABLE gemini_api_usage_logs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'global-pool'`,
    `ALTER TABLE gemini_api_usage_logs ALTER COLUMN source SET DEFAULT 'global-pool'`,
    `ALTER TABLE gemini_api_usage_logs ADD COLUMN IF NOT EXISTS key_label TEXT`,
    `CREATE TABLE IF NOT EXISTS scheduler_logs (
      id SERIAL PRIMARY KEY,
      event TEXT NOT NULL,
      details TEXT,
      data_evento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    // Sistema de Reputação WhatsApp
    `CREATE TABLE IF NOT EXISTS whatsapp_reputation (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER DEFAULT 50,
      level TEXT DEFAULT 'NOVO',
      volume_24h INTEGER DEFAULT 0,
      failure_rate NUMERIC(5,2) DEFAULT 0.00,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
      `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS delivery_payload JSONB`,
      `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_scheduled_at TIMESTAMP WITH TIME ZONE`,
    `UPDATE campaigns SET status = 'agendada' WHERE status = 'agendado'`,
    `ALTER TABLE campaign_schedule ADD COLUMN IF NOT EXISTS scheduler_claimed_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE campaign_schedule ADD COLUMN IF NOT EXISTS pause_reason TEXT`,
    `ALTER TABLE campaign_schedule ADD COLUMN IF NOT EXISTS pause_details TEXT`,
      `ALTER TABLE campaign_schedule ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE campaign_schedule ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE message_queue ADD COLUMN IF NOT EXISTS schedule_id INTEGER REFERENCES campaign_schedule(id) ON DELETE CASCADE`,
      `DO $$
       DECLARE fk_name TEXT;
       BEGIN
         SELECT tc.constraint_name
           INTO fk_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
         WHERE tc.table_name = 'message_queue'
           AND tc.constraint_type = 'FOREIGN KEY'
           AND kcu.column_name = 'contact_id'
         LIMIT 1;

         IF fk_name IS NOT NULL THEN
           EXECUTE format('ALTER TABLE message_queue DROP CONSTRAINT %I', fk_name);
         END IF;
       END $$;`,
      `ALTER TABLE message_queue ALTER COLUMN contact_id TYPE TEXT USING contact_id::text`,
      `CREATE INDEX IF NOT EXISTS idx_mq_schedule_status ON message_queue(schedule_id, status)`,
      `ALTER TABLE message_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE message_queue ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMP WITH TIME ZONE`,
      `CREATE TABLE IF NOT EXISTS contact_send_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
        campaign_name TEXT,
        contact_name TEXT,
        phone_key TEXT,
        channel TEXT,
        ok BOOLEAN DEFAULT false,
        status INTEGER,
        webhook_ok BOOLEAN DEFAULT false,
        provider_status TEXT,
        error_detail TEXT,
        payload_raw JSONB,
        delivery_summary JSONB,
        run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `ALTER TABLE contact_send_history ADD COLUMN IF NOT EXISTS provider_status TEXT`,
      `ALTER TABLE contact_send_history ADD COLUMN IF NOT EXISTS error_detail TEXT`,
      `ALTER TABLE contact_send_history ADD COLUMN IF NOT EXISTS payload_raw JSONB`,
      `ALTER TABLE contact_send_history ADD COLUMN IF NOT EXISTS delivery_summary JSONB`,
      `CREATE INDEX IF NOT EXISTS idx_contact_send_history_campaign_run_at ON contact_send_history(campaign_id, run_at DESC)`,
      `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS default_daily_message_limit INTEGER DEFAULT 300`,
      `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS default_monthly_message_limit INTEGER DEFAULT 9000`,
      `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS default_upload_quota_bytes BIGINT DEFAULT 104857600`,
      `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS global_gemini_daily_limit INTEGER DEFAULT 5000`,
      `CREATE TABLE IF NOT EXISTS user_uploaded_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        extension TEXT NOT NULL,
        media_type TEXT NOT NULL,
        size_bytes BIGINT NOT NULL,
        storage_path TEXT NOT NULL,
        public_token TEXT NOT NULL UNIQUE,
        file_blob BYTEA,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      )`,
      `ALTER TABLE user_uploaded_files ADD COLUMN IF NOT EXISTS file_blob BYTEA`,
      `CREATE INDEX IF NOT EXISTS idx_user_uploaded_files_user_created_at ON user_uploaded_files(user_id, created_at DESC)`,
      `CREATE TABLE IF NOT EXISTS active_user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        current_page TEXT,
        user_agent TEXT,
        last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_active_user_sessions_last_seen_at ON active_user_sessions(last_seen_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_active_user_sessions_user_last_seen_at ON active_user_sessions(user_id, last_seen_at DESC)`,
      `CREATE TABLE IF NOT EXISTS warmer_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        instance_a_id TEXT NOT NULL,
        instance_b_id TEXT NOT NULL,
        phone_a TEXT,
        phone_b TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
        base_daily_limit INTEGER DEFAULT 10,
        increment_per_day INTEGER DEFAULT 10,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        business_hours_start TIME DEFAULT '08:00:00',
        business_hours_end TIME DEFAULT '20:00:00',
        current_mode TEXT DEFAULT 'active' CHECK (current_mode IN ('active', 'sleeping', 'afk')),
        mode_until TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS current_mode TEXT DEFAULT 'active' CHECK (current_mode IN ('active', 'sleeping', 'afk'))`,
      `ALTER TABLE warmer_configs ADD COLUMN IF NOT EXISTS mode_until TIMESTAMP WITH TIME ZONE`,
      `CREATE TABLE IF NOT EXISTS warmer_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warmer_id UUID REFERENCES warmer_configs(id) ON DELETE CASCADE,
        from_phone TEXT NOT NULL,
        to_phone TEXT NOT NULL,
        message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'audio', 'presence')),
        content_summary TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_warmer_configs_status ON warmer_configs(status)`,
      `CREATE INDEX IF NOT EXISTS idx_warmer_logs_warmer_id_sent_at ON warmer_logs(warmer_id, sent_at)`
  ];

  for (const sql of migrations) {
    try {
      await query(sql);
    } catch (e) {
      console.warn('[Migration] Aviso ao executar:', sql.slice(0, 80), '|', e.message);
    }
  }

  console.log('[Migration] Schema atualizado com sucesso.');
}

app.post('/api/admin/users/:id/invalidate-sessions', authenticateToken, checkAdmin, invalidateUserSessions);

app.post('/api/admin/invalidate-all-sessions', authenticateToken, checkAdmin, invalidateAllSessions);

// --- ROTAS DO MATURADOR ---
app.get('/api/admin/warmer', authenticateToken, checkAdmin, listWarmers);
app.post('/api/admin/warmer', authenticateToken, checkAdmin, createWarmer);
app.put('/api/admin/warmer/:id/status', authenticateToken, checkAdmin, toggleWarmerStatus);
app.put('/api/admin/warmer/:id', authenticateToken, checkAdmin, updateWarmer);
app.get('/api/admin/warmer/:id/logs', authenticateToken, checkAdmin, getWarmerLogs);
app.post('/api/admin/warmer/:id/force', authenticateToken, checkAdmin, forceWarmerRun);

// --- FIM ADMIN ---

app.use(errorHandler);

app.listen(port, '0.0.0.0', async () => {
  console.log(`Backend listening on port ${port} (all interfaces)`);
  await runMigrations();
  await import('./queueWorker.js');
  if (process.env.EMBED_QUEUE_WORKER === 'false') {
    console.warn('[Worker] EMBED_QUEUE_WORKER=false foi ignorado. O motor agora sobe no processo principal para garantir agendamentos automáticos.');
  } else {
    console.log('[Worker] queueWorker.js incorporado ao processo principal.');
  }
});
