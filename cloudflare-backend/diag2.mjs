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
  await client.connect()

  const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position`)
  const colNames = cols.rows.map(r => r.column_name).join(', ')
  console.log('users columns:', colNames)

  const cols2 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' ORDER BY ordinal_position`)
  const col2Names = cols2.rows.map(r => r.column_name).join(', ')
  console.log('user_profiles columns:', col2Names)
  
  const count = await client.query(`SELECT COUNT(*) AS c FROM public.users`)
  console.log('users count:', count.rows[0].c)

  const perms = await client.query(`SELECT table_name, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'public' AND grantee = 'cf_hyperdrive' AND table_name IN ('users', 'user_profiles', 'app_settings') ORDER BY table_name, privilege_type`)
  const permStr = perms.rows.map(r => r.table_name + ':' + r.privilege_type).join(' | ')
  console.log('perms:', permStr || 'NONE')

  await client.end()
}

run().catch(err => { console.error('DIAG ERROR:', err.message); process.exit(1) })
