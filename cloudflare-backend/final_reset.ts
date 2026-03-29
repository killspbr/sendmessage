import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';
const targetEmail = 'claudiosorriso7@gmail.com';
const password = 'Smile123!123';

async function runReset() {
  const hash = await bcrypt.hash(password, 10);
  console.log(`Hash gerado: ${hash}`);
  
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Fase 2: Conectado ao banco...');

    const res = await client.query('UPDATE users SET password_hash = $1, token_version = COALESCE(token_version, 0) + 1 WHERE email = $2 RETURNING id', [hash, targetEmail]);
    if (res.rowCount > 0) {
      console.log(`Senha atualizada para ${targetEmail}.`);
      
      const adminGroup = await client.query("SELECT id FROM user_groups WHERE name = 'Administrador' LIMIT 1");
      if (adminGroup.rows[0]?.id) {
         await client.query("INSERT INTO user_profiles (id, group_id) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id", [res.rows[0].id, adminGroup.rows[0].id]);
         console.log('Permissões de Administrador garantidas.');
      }
    } else {
      console.log('Usuário não encontrado.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
runReset();
