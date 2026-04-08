import pg from 'pg'
const { Client } = pg

const config = { host: 'easypanel.soepinaobasta.com', port: 5433, user: 'clrodriguesuser', password: '>:0fm3jcT77ZZjYMqqwb', database: 'clrodrigues-db', ssl: false }

const client = new Client(config)

const targetUser = 'cf_hyperdrive'

async function run() {
  await client.connect()
  console.log('✅ Connected.')

  const tablesRes = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`)
  const tables = tablesRes.rows.map(r => r.tablename)
  
  console.log(`\n📌 Found ${tables.length} tables. Applying GRANT ALL...`)
  
  for (const table of tables) {
    try {
      await client.query(`GRANT ALL ON TABLE public."${table}" TO ${targetUser}`)
      console.log(`  ✅ Grant for "${table}" OK.`)
    } catch (e) {
      console.log(`  ❌ Grant for "${table}" failed: ${e.message}`)
    }
  }

  // Sequences
  await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${targetUser}`)
  await client.query(`GRANT USAGE, CREATE ON SCHEMA public TO ${targetUser}`)
  
  console.log('\n✅ Final Permissions REPAIRED definitively.')

  await client.end()
}

run().catch(err => { console.error('ERROR:', err.message); process.exit(1) })
