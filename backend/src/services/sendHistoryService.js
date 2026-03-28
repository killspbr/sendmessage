function safeJsonClone(value) {
  if (value == null) return null

  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return { raw: value }
    }
  }

  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return null
  }
}

export function normalizeHistoryPhoneKey(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.startsWith('55') ? digits.slice(2) : digits
}

export function buildDeliverySummary(deliveryResult) {
  return {
    sentText: Boolean(deliveryResult?.sentText),
    mediaSent: Number(deliveryResult?.mediaSent || 0),
    mediaFailed: Number(deliveryResult?.mediaFailed || 0),
    contactSent: Boolean(deliveryResult?.contactSent),
    contactFailed: Boolean(deliveryResult?.contactFailed),
    errors: Array.isArray(deliveryResult?.errors) ? deliveryResult.errors.map((item) => String(item)) : [],
  }
}

export function buildContactSendHistoryEntry({
  userId,
  campaign,
  contact,
  channel = 'whatsapp',
  deliveryResult = null,
  error = null,
  runAt = new Date().toISOString(),
}) {
  const deliverySummary = buildDeliverySummary(deliveryResult)
  const sentSomething =
    deliverySummary.sentText || deliverySummary.mediaSent > 0 || deliverySummary.contactSent
  const collectedErrors = [...deliverySummary.errors]

  if (error) {
    collectedErrors.unshift(String(error?.message || error || 'Erro desconhecido'))
  }

  const hasIssues =
    collectedErrors.length > 0 || deliverySummary.mediaFailed > 0 || deliverySummary.contactFailed

  let status = 500
  let ok = false
  let providerStatus = 'error'

  if (sentSomething && hasIssues) {
    status = 207
    ok = true
    providerStatus = 'partial'
  } else if (sentSomething) {
    status = 200
    ok = true
    providerStatus = 'sent'
  }

  return {
    userId,
    campaignId: campaign?.id || null,
    campaignName: campaign?.name || null,
    contactName: contact?.name || '',
    phoneKey: normalizeHistoryPhoneKey(contact?.phone || ''),
    channel,
    ok,
    status,
    webhookOk: ok,
    runAt,
    providerStatus,
    errorDetail: collectedErrors.length > 0 ? collectedErrors.join(' | ') : null,
    payloadRaw: safeJsonClone({
      deliverySummary,
      error: error ? String(error?.message || error || 'Erro desconhecido') : null,
    }),
    deliverySummary,
  }
}

export async function insertContactSendHistory(queryImpl, entry) {
  return queryImpl(
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
      entry.userId,
      entry.campaignId,
      entry.campaignName,
      entry.contactName,
      entry.phoneKey,
      entry.channel,
      entry.ok,
      entry.status,
      entry.webhookOk ?? entry.ok,
      entry.runAt,
      entry.providerStatus,
      entry.errorDetail,
      safeJsonClone(entry.payloadRaw),
      safeJsonClone(entry.deliverySummary),
    ]
  )
}

export function normalizeJsonbInput(value) {
  return safeJsonClone(value)
}
