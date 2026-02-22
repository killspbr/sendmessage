import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';

const app = express();
const port = process.env.PORT || 4000;
const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'https://automacao-n8n.rsybpi.easypanel.host/webhook-test/disparocampanhazap';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

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

// Dispara uma campanha por ID usando n8n, baseado no schema lists/contacts do Supabase
app.post('/api/campaigns/:id/send', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase não configurado no backend.' });
    }

    const campaignId = req.params.id;
    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId é obrigatório.' });
    }

    // 1) Buscar campanha
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('id, user_id, name, status, channels, list_name, message, interval_min_seconds, interval_max_seconds, created_at')
      .eq('id', campaignId)
      .single();

    if (campError || !campaign) {
      console.error('Erro ao buscar campanha:', campError);
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    // 2) Buscar lista pelo nome e user_id
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, name')
      .eq('user_id', campaign.user_id)
      .eq('name', campaign.list_name)
      .maybeSingle();

    if (listError || !list) {
      console.error('Erro ao buscar lista da campanha:', listError);
      return res.status(400).json({ error: 'Lista da campanha não encontrada.' });
    }

    // 3) Buscar contatos da lista
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, phone, email, category, cep, rating')
      .eq('user_id', campaign.user_id)
      .eq('list_id', list.id);

    if (contactsError) {
      console.error('Erro ao buscar contatos da lista:', contactsError);
      return res.status(500).json({ error: 'Falha ao carregar contatos da lista.' });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ error: 'Lista não possui contatos para envio.' });
    }

    // 4) Buscar webhooks do perfil do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('webhook_whatsapp_url, webhook_email_url')
      .eq('id', campaign.user_id)
      .maybeSingle();

    if (profileError) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      return res.status(500).json({ error: 'Falha ao carregar configurações do usuário.' });
    }

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

    const normalizePhone = (phone) => (phone || '').replace(/\D/g, '');

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

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on port ${port} (all interfaces)`);
});
