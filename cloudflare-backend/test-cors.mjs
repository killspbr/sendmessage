import fetch from 'node-fetch'

async function test() {
  const origin = 'https://sendmessage-frontend.pages.dev'
  console.log(`🚀 Testing OPTIONS for /api/campaigns from ${origin}...`)
  
  const res = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/campaigns', {
    method: 'OPTIONS',
    headers: {
      'Origin': origin,
      'Access-Control-Request-Method': 'GET'
    }
  })

  console.log(`Status: ${res.status}`)
  console.log('Headers:')
  for (const [k, v] of res.headers.entries()) {
    console.log(`  ${k}: ${v}`)
  }
}

test().catch(console.error)
