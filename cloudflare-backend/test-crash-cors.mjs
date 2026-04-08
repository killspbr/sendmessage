async function test() {
  const origin = 'https://sendmessage-frontend.pages.dev'
  console.log(`🚀 Testing CRASH route /api/crash-me from ${origin}...`)
  
  const res = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/crash-me', {
    method: 'GET',
    headers: { 'Origin': origin }
  })

  console.log('CORS_ORIGIN=' + res.headers.get('access-control-allow-origin'))
  console.log('CORS_STATUS=' + res.status)
  const body = await res.text()
  console.log('BODY=' + body)
}
test()
