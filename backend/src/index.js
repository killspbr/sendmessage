import express from 'express';
import cors from 'cors';
import { query } from './db.js';
import { login, signup, forgotPassword, resetPassword, authenticateToken } from './auth.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);

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

    addField('use_global_ai', use_global_ai);
    addField('ai_api_key', ai_api_key);
    addField('evolution_url', evolution_url);
    addField('evolution_apikey', evolution_apikey);
    addField('evolution_instance', evolution_instance);
    addField('company_info', company_info);
    addField('gemini_model', gemini_model);
    addField('gemini_api_version', gemini_api_version);
    addField('gemini_temperature', gemini_temperature);
    addField('gemini_max_tokens', gemini_max_tokens);
    addField('send_interval_min', send_interval_min);
    addField('send_interval_max', send_interval_max);

    if (count === 1) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    setClause = setClause.slice(0, -2);
    values.push(req.user.id);

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
    const { name, status, channels, list_name, message, variations, interval_min_seconds, interval_max_seconds } = req.body;
    const result = await query(
      'INSERT INTO campaigns (user_id, name, status, channels, list_name, message, variations, interval_min_seconds, interval_max_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [req.user.id, name, status || 'rascunho', channels || [], list_name, message, JSON.stringify(variations || []), interval_min_seconds || 30, interval_max_seconds || 90]
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
    const { name, status, channels, list_name, message, variations, interval_min_seconds, interval_max_seconds } = req.body;
    const result = await query(
      'UPDATE campaigns SET name = $1, status = $2, channels = $3, list_name = $4, message = $5, variations = $6, interval_min_seconds = $7, interval_max_seconds = $8 WHERE id = $9 AND user_id = $10 RETURNING *',
      [name, status, channels, list_name, message, JSON.stringify(variations || []), interval_min_seconds, interval_max_seconds, id, req.user.id]
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

// --- ENDPOINT PARA A EXTENSÃO CHROME ---
app.get('/api/extension/info', authenticateToken, async (req, res) => {
  try {
    const listsResult = await query(
      'SELECT id, name FROM lists WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id]
    );
    res.json({
      ok: true,
      user: { id: req.user.id, email: req.user.email },
      lists: listsResult.rows,
    });
  } catch (error) {
    console.error('[Extension] Erro ao buscar listas:', error);
    res.status(500).json({ error: 'Erro ao buscar listas', details: error.message });
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
    const channels = Array.isArray(campaign.channels) ? campaign.channels : [];
    const effectiveChannels = channels.filter((ch) => {
      if (ch === 'whatsapp') {
        // Agora disparos de WhatsApp exigem Evolution API configurada
        return (!!evolutionUrl && !!evolutionInstance);
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
      return text
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };

    const htmlToText = (html) =>
      html
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

    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

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
      await incrementKeyUsage(keyData.id, 'extract-contact', 'JSON Extracted', aiRes.ok ? null : data);
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
    const { prompt, model, systemInstruction, temperature, maxTokens } = req.body;
    
    const keyData = await getActiveGeminiKey();
    if (!keyData) {
      return res.status(503).json({ error: 'Cota de IA esgotada. Por favor, adicione novas chaves Gemini no painel administrativo.' });
    }

    const actualModel = model || 'gemini-1.5-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1/models/${actualModel}:generateContent?key=${keyData.api_key}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature || 0.7,
        maxOutputTokens: maxTokens || 2048,
      }
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await aiRes.json();
    
    // Incrementa uso e log
    await incrementKeyUsage(keyData.id, 'proxy', 'AI Response', aiRes.ok ? null : data);

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

// --- GESTÃO DE CHAVES GEMINI ---

app.get('/api/admin/gemini-keys', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, nome, status, ultimo_uso, requests_count, data_cadastro, observacoes FROM gemini_api_keys ORDER BY data_cadastro DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar chaves Gemini' });
  }
});

app.post('/api/admin/gemini-keys', authenticateToken, async (req, res) => {
  try {
    const { nome, api_key, status, observacoes } = req.body;
    const result = await query(
      'INSERT INTO gemini_api_keys (user_id, nome, api_key, status, observacoes) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, status',
      [req.user.id, nome, api_key, status || 'ativa', observacoes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao cadastrar chave Gemini' });
  }
});

app.delete('/api/admin/gemini-keys/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM gemini_api_keys WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao deletar chave Gemini' });
  }
});

app.post('/api/admin/gemini-keys/reset', authenticateToken, async (req, res) => {
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
    
    // Cancela agendamentos anteriores da mesma campanha
    await query('UPDATE campaign_schedule SET status = \'cancelado\' WHERE campaign_id = $1 AND status = ANY($2)', [id, ['agendado', 'em_execucao', 'pausado']]);

    const result = await query(
      'INSERT INTO campaign_schedule (campaign_id, user_id, data_inicio, hora_inicio, limite_diario, intervalo_minimo, intervalo_maximo, mensagens_por_lote, tempo_pausa_lote) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, req.user.id, data_inicio || new Date().toISOString().split('T')[0], hora_inicio || new Date().toTimeString().split(' ')[0], limite_diario || 300, intervalo_minimo || 30, intervalo_maximo || 90, mensagens_por_lote || 45, tempo_pausa_lote || 15]
    );
    
    // Atualiza status da campanha
    await query('UPDATE campaigns SET status = \'agendado\', last_scheduled_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao agendar campanha:', error);
    res.status(500).json({ error: 'Erro ao agendar campanha' });
  }
});

app.get('/api/admin/operational-stats', authenticateToken, async (req, res) => {
  try {
    const stats = {
      enviadas_hoje: 0,
      enviadas_ultima_hora: 0,
      fila_pendente: 0,
      falhas_hoje: 0,
      campanhas_em_execucao: 0,
      ai: {
        requestsToday: 0,
        activeKeys: 0
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
    
    const resAiu = await query("SELECT sum(requests_count) FROM gemini_api_keys");
    stats.ai.requestsToday = parseInt(resAiu.rows[0].sum || 0);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[AdminStats] Erro:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas operacionais' });
  }
});

app.delete('/api/campaigns/:id/schedule', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM message_queue WHERE campaign_id = $1 AND status = $2', [id, 'pendente']);
    await query("UPDATE campaign_schedule SET status = 'cancelado' WHERE campaign_id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao cancelar agendamento' });
  }
});

app.get('/api/admin/schedules', authenticateToken, async (req, res) => {
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

app.get('/api/admin/queue', authenticateToken, async (req, res) => {
  try {
    const resQueue = await query(`
      SELECT q.*, c.name as campaign_name 
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
app.delete('/api/admin/group-permissions', authenticateToken, async (req, res) => {
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
    `ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest'`,
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
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest'`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gemini_api_version TEXT DEFAULT 'v1'`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gemini_temperature NUMERIC(3,2) DEFAULT 0.7`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gemini_max_tokens INTEGER DEFAULT 1024`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS send_interval_min INTEGER DEFAULT 30`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS send_interval_max INTEGER DEFAULT 90`,
    // app_settings: garantir que a tabela exista mesmo que nunca tenha sido criada
    `CREATE TABLE IF NOT EXISTS app_settings (
      id SERIAL PRIMARY KEY,
      global_ai_api_key TEXT,
      evolution_api_url TEXT,
      evolution_api_key TEXT,
      evolution_shared_instance TEXT,
      gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest',
      gemini_api_version TEXT DEFAULT 'v1',
      gemini_temperature NUMERIC(3,2) DEFAULT 0.7,
      gemini_max_tokens INTEGER DEFAULT 1024,
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
      campaign_id UUID NOT NULL,
      user_id UUID NOT NULL,
      data_inicio DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      limite_diario INTEGER DEFAULT 300,
      intervalo_minimo INTEGER DEFAULT 30,
      intervalo_maximo INTEGER DEFAULT 90,
      mensagens_por_lote INTEGER DEFAULT 45,
      tempo_pausa_lote INTEGER DEFAULT 15,
      status TEXT DEFAULT 'agendado',
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS message_queue (
      id SERIAL PRIMARY KEY,
      campaign_id UUID NOT NULL,
      user_id UUID NOT NULL,
      contact_id UUID,
      telefone TEXT NOT NULL,
      nome TEXT,
      mensagem TEXT NOT NULL,
      status TEXT DEFAULT 'pendente',
      tentativas INTEGER DEFAULT 0,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      data_envio TIMESTAMP WITH TIME ZONE,
      erro TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS gemini_api_keys (
      id SERIAL PRIMARY KEY,
      user_id UUID,
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
      key_id INTEGER NOT NULL,
      user_id UUID,
      module TEXT,
      resultado TEXT,
      erro TEXT,
      data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS scheduler_logs (
      id SERIAL PRIMARY KEY,
      event TEXT NOT NULL,
      details TEXT,
      data_evento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    // Sistema de Reputação WhatsApp
    `CREATE TABLE IF NOT EXISTS whatsapp_reputation (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL UNIQUE,
      score INTEGER DEFAULT 50,
      level TEXT DEFAULT 'NOVO',
      volume_24h INTEGER DEFAULT 0,
      failure_rate NUMERIC(5,2) DEFAULT 0.00,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_scheduled_at TIMESTAMP WITH TIME ZONE`,
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

app.listen(port, '0.0.0.0', async () => {
  console.log(`Backend listening on port ${port} (all interfaces)`);
  await runMigrations();
});
