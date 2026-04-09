async function test() {
  const resp = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://sendmessage-frontend.pages.dev'
    },
    body: JSON.stringify({ email: 'claudiosorriso7@gmail.com', password: 'Smile123!' })
  });
  
  console.log('Status:', resp.status);
  console.log('Headers:', JSON.stringify(Object.fromEntries(resp.headers.entries()), null, 2));
  const text = await resp.text();
  console.log('Body:', text);
}

test();
