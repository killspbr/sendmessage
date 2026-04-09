async function check() {
  try {
    const loginResp = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'claudiosorriso7@gmail.com', password: 'Smile123!' })
    });
    console.log('Login Status:', loginResp.status);
    if (!loginResp.ok) {
       console.log('Login failed:', await loginResp.text());
       return;
    }
    const { token } = await loginResp.json();
    
    const resp = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/campaigns?page=1&limit=5', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Campaigns Status:', resp.status);
    const body = await resp.text();
    console.log('Campaigns Body:', body.substring(0, 500));
  } catch (e) {
    console.error('Check failed:', e);
  }
}

check();
