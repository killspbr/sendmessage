import pg from 'pg'
const { Client } = pg

const config = { 
  host: 'easypanel.soepinaobasta.com', 
  port: 5433, 
  user: 'clrodriguesuser', 
  password: '>:0fm3jcT77ZZjYMqqwb', 
  database: 'clrodrigues-db', 
  ssl: false 
}

const client = new Client(config)

async function run() {
  console.log('⏳ Testing connection latency...')
  const start = Date.now()
  await client.connect()
  const connected = Date.now() - start
  console.log(`✅ Connected in ${connected}ms.`)

  const qStart = Date.now()
  const res = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = $1', ['public'])
  const queryTime = Date.now() - qStart
  console.log(`✅ Query finished in ${queryTime}ms. Found ${res.rows.length} tables.`)

  // Check campaigns table structure specifically
  const campStart = Date.now()
  const campCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'campaigns'
  `)
  console.log(`✅ Campaign structure fetch in ${Date.now() - campStart}ms.`)
  
  await client.end()
}

run().catch(err => { console.error('❌ Connection DB ERROR:', err.message); process.exit(1) })
