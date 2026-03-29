const { Client } = require('pg');
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function checkUser() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT id, email, password_hash, token_version FROM users WHERE email = 'claudiosorriso7@gmail.com'");
    console.log(JSON.stringify(res.rows, null, 2));
    
    const prof = await client.query("SELECT * FROM user_profiles WHERE id = (SELECT id FROM users WHERE email = 'claudiosorriso7@gmail.com')");
    console.log('Profile:', JSON.stringify(prof.rows, null, 2));

    const groups = await client.query("SELECT * FROM user_groups");
    console.log('Groups:', JSON.stringify(groups.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkUser();
