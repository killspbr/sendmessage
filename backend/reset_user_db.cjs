const { Client } = require('pg');

const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';
const targetEmail = 'claudiosorriso7@gmail.com';
const targetHash = '$2b$10$wkgVACiTm0inmzZe.1jGAeiOfjS/rZlG4L5barLIWHU4rO8Ss2dFu'; // Hash for Smile123!123

async function runReset() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Conectado ao banco Postgres (Easypanel)...');

    // 1. Get User ID
    const userRes = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [targetEmail]);
    if (userRes.rows.length === 0) {
      console.log(`Usuário ${targetEmail} não encontrado. Criando novo usuário...`);
      // Optional: Create user if not exists (but user request said REDEFINE, implying it exists)
      // I'll assume it exists or try to find an admin group first.
    }
    const userId = userRes.rows[0]?.id;

    if (userId) {
      // 2. Update Password and Token Version
      await client.query(
        'UPDATE users SET password_hash = $1, token_version = COALESCE(token_version, 0) + 1 WHERE id = $2',
        [targetHash, userId]
      );
      console.log(`Senha atualizada para o usuário ID ${userId}.`);

      // 3. Find Admin Group ID
      const groupRes = await client.query("SELECT id FROM user_groups WHERE name = 'Administrador' LIMIT 1");
      const adminGroupId = groupRes.rows[0]?.id;

      if (adminGroupId) {
        // 4. Ensure admin permissions
        await client.query(
          'INSERT INTO user_profiles (id, group_id) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET group_id = $2',
          [userId, adminGroupId]
        );
        console.log(`Usuário vinculado ao grupo 'Administrador' (ID ${adminGroupId}).`);
      } else {
        console.log("Grupo 'Administrador' não encontrado na tabela user_groups.");
      }
    } else {
       console.log("Usuário não encontrado. Abortando update.");
    }

  } catch (err) {
    console.error('Erro ao executar reset:', err);
  } finally {
    await client.end();
  }
}

runReset();
