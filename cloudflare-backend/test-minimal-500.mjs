async function test() {
  const origin = 'https://sendmessage-frontend.pages.dev'
  console.log(`🚀 Testing MINIMAL worker /api/test-500 from ${origin}...`)
  
  const res = await fetch('https://sendmessage-backend-minimal.engclrodrigues.workers.dev/api/test-500', {
    method: 'GET',
    headers: { 'Origin': origin }
  })

  console.log('CORS_ORIGIN=' + res.headers.get('access-control-allow-origin'))
  console.log('CORS_STATUS=' + res.status)
  const body = await res.text()
  console.log('BODY=' + body)
}
test()
