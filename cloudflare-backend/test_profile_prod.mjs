async function test() {
  const loginResp = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'claudiosorriso7@gmail.com', password: 'Smile123!' })
  });
  const { token } = await loginResp.json();
  
  const resp = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/profile/full', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Status:', resp.status);
  const text = await resp.text();
  console.log('Body:', text);
}

test();
