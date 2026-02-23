import express from 'express';
import cors from 'cors';
import { query } from './db.js';
import { login, signup, authenticateToken } from './auth.js';

const app = express();
const port = process.env.PORT || 4000;
const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'https://automacao-n8n.rsybpi.easypanel.host/webhook-test/disparocampanhazap';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);

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

app.post('/api/profile', authenticateToken, async (req, res) => {
  try {
    const {
      webhook_whatsapp_url,
      webhook_email_url,
      use_global_ai,
      ai_api_key,
      use_global_webhooks
    } = req.body;

    await query(
      `INSERT INTO user_profiles (id, webhook_whatsapp_url, webhook_email_url, use_global_ai, ai_api_key, use_global_webhooks) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (id) DO UPDATE SET 
         webhook_whatsapp_url = EXCLUDED.webhook_whatsapp_url, 
         webhook_email_url = EXCLUDED.webhook_email_url,
         use_global_ai = EXCLUDED.use_global_ai,
         ai_api_key = EXCLUDED.ai_api_key,
         use_global_webhooks = EXCLUDED.use_global_webhooks`,
      [req.user.id, webhook_whatsapp_url, webhook_email_url, use_global_ai, ai_api_key, use_global_webhooks]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar perfil' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const {
      webhook_whatsapp_url,
      webhook_email_url,
      use_global_ai,
      ai_api_key,
      use_global_webhooks
    } = req.body;

    const fields = [];
    const values = [];
    let setClause = '';
    let count = 1;

    if (webhook_whatsapp_url !== undefined) {
      fields.push('webhook_whatsapp_url');
      values.push(webhook_whatsapp_url);
      setClause += `webhook_whatsapp_url = $${count++}, `;
    }
    if (webhook_email_url !== undefined) {
      fields.push('webhook_email_url');
      values.push(webhook_email_url);
      setClause += `webhook_email_url = $${count++}, `;
    }
    if (use_global_ai !== undefined) {
      fields.push('use_global_ai');
      values.push(use_global_ai);
      setClause += `use_global_ai = $${count++}, `;
    }
    if (ai_api_key !== undefined) {
      fields.push('ai_api_key');
      values.push(ai_api_key);
      setClause += `ai_api_key = $${count++}, `;
    }
    if (use_global_webhooks !== undefined) {
      fields.push('use_global_webhooks');
      values.push(use_global_webhooks);
      setClause += `use_global_webhooks = $${count++}, `;
    }

    if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    setClause = setClause.slice(0, -2);
    values.push(req.user.id);

    await query(
      `UPDATE user_profiles SET ${setClause} WHERE id = $${count}`,
      values
    );
    res.json({ ok: true });
  } catch (error) {
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
    const { name, status, channels, list_name, message, interval_min_seconds, interval_max_seconds } = req.body;
    const result = await query(
      'INSERT INTO campaigns (user_id, name, status, channels, list_name, message, interval_min_seconds, interval_max_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, name, status || 'rascunho', channels || [], list_name, message, interval_min_seconds || 30, interval_max_seconds || 90]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar campanha' });
  }
});

app.put('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, channels, list_name, message, interval_min_seconds, interval_max_seconds } = req.body;
    const result = await query(
      'UPDATE campaigns SET name = $1, status = $2, channels = $3, list_name = $4, message = $5, interval_min_seconds = $6, interval_max_seconds = $7 WHERE id = $8 AND user_id = $9 RETURNING *',
      [name, status, channels, list_name, message, interval_min_seconds, interval_max_seconds, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
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
});

app.post('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const { list_id, name, phone, email, category, cep, rating, address, city, state, instagram, facebook, whatsapp, website } = req.body;
    const result = await query(
      'INSERT INTO contacts (user_id, list_id, name, phone, email, category, cep, rating, address, city, state, instagram, facebook, whatsapp, website) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
      [req.user.id, list_id, name, phone, email, category, cep, rating, address, city, state, instagram, facebook, whatsapp, website]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar contato' });
  }
});

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
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
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
    const { campaign_id, contact_name, phone_key, channel, ok, status, webhook_ok, run_at } = req.body;
    const result = await query(
      'INSERT INTO contact_send_history (user_id, campaign_id, contact_name, phone_key, channel, ok, status, webhook_ok, run_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [req.user.id, campaign_id, contact_name, phone_key, channel, ok, status, webhook_ok, run_at || new Date().toISOString()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar histórico de contato' });
  }
});

app.delete('/api/history', authenticateToken, async (req, res) => {
  try {
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
app.get('/api/settings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM app_settings LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações globais' });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { global_ai_api_key, global_webhook_whatsapp_url, global_webhook_email_url } = req.body;

    // Tenta atualizar se existir, ou inserir se não
    const check = await query('SELECT id FROM app_settings LIMIT 1');

    let result;
    if (check.rows.length > 0) {
      result = await query(
        'UPDATE app_settings SET global_ai_api_key = $1, global_webhook_whatsapp_url = $2, global_webhook_email_url = $3, updated_at = CURRENT_TIMESTAMP RETURNING *',
        [global_ai_api_key, global_webhook_whatsapp_url, global_webhook_email_url]
      );
    } else {
      result = await query(
        'INSERT INTO app_settings (global_ai_api_key, global_webhook_whatsapp_url, global_webhook_email_url) VALUES ($1, $2, $3) RETURNING *',
        [global_ai_api_key, global_webhook_whatsapp_url, global_webhook_email_url]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar configurações globais' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'sendmessage-backend' });
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

    // 3) Buscar contatos da lista
    const contactsResult = await query(
      'SELECT id, name, phone, email, category, cep, rating FROM contacts WHERE user_id = $1 AND list_id = $2',
      [req.user.id, list.id]
    );
    const contacts = contactsResult.rows;

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'Lista não possui contatos para envio.' });
    }

    // 4) Buscar webhooks do perfil do usuário
    const profileResult = await query(
      'SELECT webhook_whatsapp_url, webhook_email_url FROM user_profiles WHERE id = $1',
      [req.user.id]
    );
    const userProfile = profileResult.rows[0];

    console.log('[DEBUG] User ID:', campaign.user_id);
    console.log('[DEBUG] User Profile:', userProfile);
    console.log('[DEBUG] Webhook WhatsApp do perfil:', userProfile?.webhook_whatsapp_url);
    console.log('[DEBUG] Webhook Email do perfil:', userProfile?.webhook_email_url);
    console.log('[DEBUG] Webhook WhatsApp env:', process.env.WEBHOOK_WHATSAPP);
    console.log('[DEBUG] Webhook Email env:', process.env.WEBHOOK_EMAIL);

    // Usar webhooks do perfil do usuário, ou fallback para env vars
    const webhookUrlWhatsApp = userProfile?.webhook_whatsapp_url || process.env.WEBHOOK_WHATSAPP || '';
    const webhookUrlEmail = userProfile?.webhook_email_url || process.env.WEBHOOK_EMAIL || '';

    console.log('[DEBUG] Webhook WhatsApp final:', webhookUrlWhatsApp);
    console.log('[DEBUG] Webhook Email final:', webhookUrlEmail);

    // 5) Determinar canais efetivos
    const channels = Array.isArray(campaign.channels) ? campaign.channels : [];
    console.log('[DEBUG] Canais da campanha:', channels);

    const effectiveChannels = channels.filter((ch) =>
      ch === 'whatsapp' ? !!webhookUrlWhatsApp.trim() : !!webhookUrlEmail.trim(),
    );

    console.log('[DEBUG] Canais efetivos:', effectiveChannels);

    if (effectiveChannels.length === 0) {
      return res.status(400).json({
        error:
          'Nenhum webhook configurado para os canais desta campanha. O administrador precisa configurar webhooks para este usuário.',
      });
    }

    const intervalMin = campaign.interval_min_seconds ?? 30;
    const intervalMax = campaign.interval_max_seconds ?? 90;

    const normalizePhone = (phone) => {
      const digits = (phone || '').replace(/\D/g, '');
      return digits.startsWith('55') ? digits.substring(2) : digits;
    };

    const htmlToWhatsapp = (html) => {
      return html
        .replace(/<br\s*\/?>(?=\s*<br\s*\/?)/gi, '\n')
        .replace(/<br\s*\/?>(?!\s*<br\s*\/?)/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    };

    const htmlToText = (html) =>
      html
        .replace(/<br\s*\/?>(?=\s*<br\s*\/?)/gi, '\n')
        .replace(/<br\s*\/?>(?!\s*<br\s*\/?)/gi, '\n')
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

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const contactIndex = i + 1;

      for (const channel of effectiveChannels) {
        if (channel === 'whatsapp') {
          const phone = normalizePhone(contact.phone);
          if (!phone) continue;
        }
        if (channel === 'email') {
          const email = (contact.email || '').trim();
          if (!email) continue;
        }

        const targetWebhookUrl = channel === 'whatsapp' ? webhookUrlWhatsApp.trim() : webhookUrlEmail.trim();
        const isEmailChannel = channel === 'email';

        const payload = {
          meta: {
            source: 'sendmessage',
            trigger: 'campaign',
            campaignId: campaign.id,
            campaignName: campaign.name,
            listId: list.id,
            listName: list.name,
            channels: [channel],
            createdAt: campaign.created_at,
            contactIndex,
            totalContacts: contacts.length,
          },
          message: isEmailChannel ? messageHtml : htmlToWhatsapp(messageHtml),
          messageText,
          messageHtml,
          contacts: [
            {
              id: contact.id,
              name: contact.name,
              phone: normalizePhone(contact.phone),
              email: contact.email,
              category: contact.category,
              rating: contact.rating ?? null,
              cep: contact.cep,
            },
          ],
        };

        try {
          const backendBase = process.env.BACKEND_PUBLIC_URL || process.env.BACKEND_PUBLIC_URI || `http://localhost:${port}`;
          const response = await fetch(`${backendBase}/api/n8n/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ webhookUrl: targetWebhookUrl, ...payload }),
          });

          if (!response.ok) {
            errors++;
          }
        } catch (e) {
          console.error('Erro ao chamar /api/n8n/trigger para campanha agendada:', e);
          errors++;
        }
      }

      const delaySeconds =
        intervalMin + Math.floor(Math.random() * Math.max(1, intervalMax - intervalMin + 1));
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
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

    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API Key não informada.' });
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

    const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
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
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Erro Gemini API:', response.status, text);
      return res.status(500).json({ error: 'Falha ao chamar API Gemini.', status: response.status, details: text });
    }

    const data = await response.json();
    let textResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.candidates?.[0]?.output_text || '';

    // Alguns modelos retornam o JSON dentro de ```json ... ```
    if (typeof textResponse === 'string') {
      textResponse = textResponse.trim();
      if (textResponse.startsWith('```')) {
        textResponse = textResponse.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '');
      }
    }

    let parsed = null;
    try {
      parsed = JSON.parse(textResponse);
    } catch (e) {
      console.error('Falha ao fazer parse do JSON retornado pelo Gemini:', textResponse);
      return res.status(500).json({
        error: 'Resposta do Gemini em formato inesperado. Ajuste o prompt.',
        raw: textResponse,
      });
    }

    const contact = {
      name: parsed?.name || '',
      phone: parsed?.phone || '',
      email: parsed?.email || '',
      category: parsed?.category || 'IA',
      address: parsed?.address || '',
      city: parsed?.city || '',
      state: parsed?.state || '',
      instagram: parsed?.instagram || '',
      facebook: parsed?.facebook || '',
      whatsapp: parsed?.whatsapp || '',
      website: parsed?.website || '',
    };

    res.json({ ok: true, contact, raw: parsed });
  } catch (error) {
    console.error('Erro em /api/ai/extract-contact:', error);
    res.status(500).json({ error: 'Falha ao processar imagem com Gemini.', details: error.message });
  }
});

app.post('/api/n8n/trigger', async (req, res) => {
  try {
    const targetUrl = req.body?.webhookUrl || N8N_WEBHOOK_URL;
    const triggerType = req.body?.meta?.trigger || 'unknown';
    const campaignName = req.body?.meta?.campaignName || 'N/A';
    const contactIndex = req.body?.meta?.contactIndex || 0;
    const totalContacts = req.body?.meta?.totalContacts || 0;

    if (!targetUrl) {
      return res.status(500).json({ error: 'Nenhum webhook configurado para envio.' });
    }

    console.log(`[n8n] Trigger: ${triggerType} | Campanha: ${campaignName} | Contato: ${contactIndex}/${totalContacts}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    console.log('[n8n] Resposta do webhook:', response.status);

    res.status(response.status).json({ ok: response.ok, status: response.status, data });
  } catch (error) {
    console.error('Erro ao chamar webhook n8n:', error);
    res.status(500).json({ error: 'Falha ao chamar webhook n8n.', details: error.message });
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
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT up.*, ug.name as group_name, u.name as user_name, u.email
       FROM user_profiles up
       LEFT JOIN user_groups ug ON up.group_id = ug.id
       LEFT JOIN users u ON up.id = u.id
       ORDER BY up.id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Listar todos os grupos (Admin)
app.get('/api/admin/groups', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM user_groups ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar grupos' });
  }
});

// Listar todas as permissões (Admin)
app.get('/api/admin/permissions', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM permissions ORDER BY code ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
});

// Listar todas as relações grupo-permissão (Admin)
app.get('/api/admin/group-permissions', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM group_permissions');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar permissões de grupos' });
  }
});

// Atualizar grupo de um usuário (Admin)
app.put('/api/admin/users/:id/group', authenticateToken, async (req, res) => {
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
app.put('/api/admin/users/:id/settings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const allowedFields = ['use_global_ai', 'use_global_webhooks', 'webhook_whatsapp_url', 'webhook_email_url', 'display_name'];

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

// Adicionar permissão a um grupo (Admin)
app.post('/api/admin/group-permissions', authenticateToken, async (req, res) => {
  try {
    const { group_id, permission_id } = req.body;
    await query('INSERT INTO group_permissions (group_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [group_id, permission_id]);
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar permissão ao grupo' });
  }
});

// Remover permissão de um grupo (Admin)
app.delete('/api/admin/group-permissions', authenticateToken, async (req, res) => {
  try {
    const { group_id, permission_id } = req.body;
    await query('DELETE FROM group_permissions WHERE group_id = $1 AND permission_id = $2', [group_id, permission_id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover permissão do grupo' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on port ${port} (all interfaces)`);
});
