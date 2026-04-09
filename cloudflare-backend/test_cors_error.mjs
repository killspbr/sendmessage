async function test() {
  const resp = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/invalid-route-test', {
    method: 'GET',
    headers: {
      'Origin': 'https://sendmessage-frontend.pages.dev'
    }
  });
  
  console.log('Status:', resp.status);
  console.log('Headers:', JSON.stringify(Object.fromEntries(resp.headers.entries()), null, 2));
}

test();
