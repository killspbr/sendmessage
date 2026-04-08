async function test() {
  const origin = 'https://sendmessage-frontend.pages.dev'
  console.log(`🚀 Testing GET /api/campaigns (without token) from ${origin}...`)
  
  const res = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/campaigns', {
    method: 'GET',
    headers: { 'Origin': origin }
  })

  console.log('CORS_ORIGIN=' + res.headers.get('access-control-allow-origin'))
  console.log('CORS_STATUS=' + res.status)
  const body = await res.json()
  console.log('BODY=' + JSON.stringify(body))
}
test()
