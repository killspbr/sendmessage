async function run() {
  const body = {
    email: 'claudiosorriso7@gmail.com',
    password: 'Smile123!'
  };
  
  const response = await fetch('https://sendmessage-backend.engclrodrigues.workers.dev/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://sendmessage-frontend.pages.dev'
    },
    body: JSON.stringify(body)
  });
  
  console.log('Status:', response.status);
  console.log('CORS Origin:', response.headers.get('Access-Control-Allow-Origin'));
  console.log('Body:', await response.text());
}

run().catch(console.error);
