// Usando fetch nativo do Node.js

const BASE_URL = 'https://sendmessage-backend.engclrodrigues.workers.dev'
const ORIGIN = 'https://sendmessage-frontend.pages.dev'

async function forensicAudit() {
  console.log('🕵️ Iniciando Auditoria Forense...')

  // 1. Signup / Login para obter Token
  const testEmail = `test_${Date.now()}@example.com`
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({ email: testEmail, password: 'Password123!', name: 'Forense Test' })
  })
  
  const signupData = await signupRes.json()
  const token = signupData.token
  
  if (!token) {
    console.error('❌ Falha ao obter token. Resposta:', signupData)
    // Se falhar signup, tentamos login num fixo se possível, ou apenas prosseguimos sem token para ver CORS
  } else {
    console.log('✅ Token obtido com sucesso.')
  }

  const routes = [
    { name: 'Profile', path: '/api/profile', method: 'GET' },
    { name: 'Profile Full', path: '/api/profile/full', method: 'GET' },
    { name: 'Lists', path: '/api/lists', method: 'GET' },
    { name: 'Campaigns', path: '/api/campaigns?page=1&limit=20', method: 'GET' },
    { name: 'History', path: '/api/history?page=1&limit=100', method: 'GET' },
    { name: 'Admin Warmer', path: '/api/admin/warmer', method: 'GET' },
    { name: 'Presence', path: '/api/auth/presence', method: 'POST', body: {} }
  ]

  const results = []

  for (const { name, path, method, body } of routes) {
    console.log(`🚀 Testando ${name} (${method} ${path})...`)
    const headers = { 
      'Origin': ORIGIN,
      'Content-Type': 'application/json'
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      // Teste CORS (OPTIONS)
      const optionsRes = await fetch(`${BASE_URL}${path}`, { method: 'OPTIONS', headers })
      const corsOk = optionsRes.headers.get('access-control-allow-origin') === ORIGIN

      // Teste Real
      const res = await fetch(`${BASE_URL}${path}`, { 
        method, 
        headers,
        body: body ? JSON.stringify(body) : undefined
      })
      
      const status = res.status
      const corsHeader = res.headers.get('access-control-allow-origin')
      const data = await res.json().catch(() => null)

      results.push({
        Route: name,
        Path: path,
        Status: status,
        CORS: corsHeader === ORIGIN ? '✅' : `❌ (${corsHeader})`,
        OptionsCORS: corsOk ? '✅' : '❌',
        Error: data?.error || (status >= 400 ? 'Corpo inválido' : 'Nenhum'),
        Technical: data?.technical || 'N/A'
      })
    } catch (e) {
      results.push({
        Route: name,
        Path: path,
        Status: 'CRASH',
        CORS: 'N/A',
        OptionsCORS: 'N/A',
        Error: e.message,
        Technical: 'Fetch Error'
      })
    }
  }

  console.table(results)
}

forensicAudit()
