async function test() {
  const origin = 'https://sendmessage-frontend.pages.dev'
  console.log(`🚀 Testing POST /api/auth/login from ${origin}...`)
  
  const res = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/auth/login', {
    method: 'OPTIONS',
    headers: { 
      'Origin': origin, 
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  })

  console.log('OPTIONS_CORS_ORIGIN=' + res.headers.get('access-control-allow-origin'))
  console.log('OPTIONS_STATUS=' + res.status)

  const postRes = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Origin': origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'pwd' })
  })

  console.log('POST_CORS_ORIGIN=' + postRes.headers.get('access-control-allow-origin'))
  console.log('POST_STATUS=' + postRes.status)
}
test()
