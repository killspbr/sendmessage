import pg from 'pg'
const { Client } = pg

const config = { host: 'easypanel.soepinaobasta.com', port: 5433, user: 'clrodriguesuser', password: '>:0fm3jcT77ZZjYMqqwb', database: 'clrodrigues-db', ssl: false }

const client = new Client(config)

const targets = ['users', 'user_profiles', 'campaigns', 'lists', 'contacts', 'app_settings', 'active_user_sessions']

async function run() {
  await client.connect()
  const res = await client.query(`
    SELECT table_name, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE grantee = 'cf_hyperdrive' 
    AND table_name = ANY($1)
    ORDER BY table_name, privilege_type
  `, [targets])
  
  const perms = res.rows.reduce((acc, row) => {
    acc[row.table_name] = (acc[row.table_name] || []) + [row.privilege_type]
    return acc
  }, {})
  
  console.log('--- PERMISSIONS FOR cf_hyperdrive ---')
  Object.entries(perms).forEach(([table, p]) => console.log(`${table}: ${p}`))
  
  await client.end()
}

run().catch(e => console.error(e))
