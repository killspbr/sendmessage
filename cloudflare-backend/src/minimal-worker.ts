export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '*'
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: { 
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    if (new URL(request.url).pathname === '/api/test-400') {
      return new Response('ERROR 400', { 
        status: 400, 
        headers: { 
          'Access-Control-Allow-Origin': origin, 
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'text/plain'
        }
      })
    }

    return new Response('OK', { 
      status: 200, 
      headers: { 
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true'
      }
    })
  }
}
