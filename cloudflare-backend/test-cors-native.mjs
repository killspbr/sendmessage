async function test() {
  const origin = 'https://sendmessage-frontend.pages.dev'
  console.log(`🚀 Testing OPTIONS for /api/campaigns from ${origin}...`)
  
  try {
    const res = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/campaigns', {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      }
    })

    console.log(`Status: ${res.status}`)
    console.log('Headers:')
    res.headers.forEach((v, k) => {
      console.log(`  ${k}: ${v}`)
    })
  } catch (err) {
    console.error('Fetch Error:', err.message)
  }
}

test()
