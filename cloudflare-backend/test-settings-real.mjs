async function test() {
  const origin = 'https://sendmessage-frontend.pages.dev'
  console.log(`🚀 Testing REAL GET /api/settings from ${origin}...`)
  
  const res = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/settings', {
    method: 'GET',
    headers: { 'Origin': origin }
  })

  console.log('CORS_ORIGIN=' + res.headers.get('access-control-allow-origin'))
  console.log('CORS_STATUS=' + res.status)
  const body = await res.text()
  console.log('BODY=' + body)
}
test()
