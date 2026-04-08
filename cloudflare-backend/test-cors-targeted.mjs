async function test() {
  const origin = 'https://sendmessage-frontend.pages.dev'
  const res = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/campaigns', {
    method: 'OPTIONS',
    headers: { 'Origin': origin, 'Access-Control-Request-Method': 'GET' }
  })

  console.log('CORS_ORIGIN=' + res.headers.get('access-control-allow-origin'))
  console.log('CORS_METHODS=' + res.headers.get('access-control-allow-methods'))
  console.log('CORS_STATUS=' + res.status)
}
test()
