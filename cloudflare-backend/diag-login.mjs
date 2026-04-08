import pg from 'pg'
const { Client } = pg

// Conexão direta com o mesmo DB que o Hyperdrive usa
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
  console.log('✅ Connected.')

  // Verifica a estrutura da tabela users
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY ordinal_position
  `)
  
  console.log('\n📋 Tabela: public.users')
  for (const c of cols.rows) {
    console.log(`  ${c.column_name} | ${c.data_type} | nullable:${c.is_nullable} | default:${c.column_default || '-'}`)
  }

  // Verifica a estrutura da tabela user_profiles
  const cols2 = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ORDER BY ordinal_position
  `)
  
  console.log('\n📋 Tabela: public.user_profiles')
  for (const c of cols2.rows) {
    console.log(`  ${c.column_name} | ${c.data_type} | nullable:${c.is_nullable} | default:${c.column_default || '-'}`)
  }
  
  // Contagem de usuários e se JWT_SECRET pode ser o problema (não testamos aqui)
  const usersCount = await client.query(`SELECT COUNT(*) FROM public.users`)
  console.log(`\n👥 Total de usuários cadastrados: ${usersCount.rows[0].count}`)

  // Verifica se a role cf_hyperdrive tem permissões nas tabelas críticas
  const perms = await client.query(`
    SELECT table_name, grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee = 'cf_hyperdrive'
      AND table_name IN ('users', 'user_profiles', 'app_settings')
    ORDER BY table_name, privilege_type
  `)
  
  console.log('\n🔐 Permissões de cf_hyperdrive nas tabelas críticas:')
  if (perms.rows.length === 0) {
    console.log('  ⚠️  NENHUMA PERMISSÃO ENCONTRADA para cf_hyperdrive!')
  } else {
    for (const r of perms.rows) {
      console.log(`  ${r.table_name} | ${r.grantee}: ${r.privilege_type}`)
    }
  }
  
  await client.end()
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1) })
