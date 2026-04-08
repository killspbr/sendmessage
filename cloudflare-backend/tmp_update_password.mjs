import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgres://cf_hyperdrive:CfHyper2026Safe@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=require';

async function run() {
  const client = new Client({ 
    user: 'cf_hyperdrive',
    host: 'easypanel.soepinaobasta.com',
    database: 'sendmessage',
    password: 'CfHyper2026Safe',
    port: 5433,
    ssl: {
      rejectUnauthorized: false
    }
  });
  try {
    await client.connect();
    console.log('Connected to database.');

    const email = 'claudiosorriso7@gmail.com';
    const newHash = 'sha256:3a8777fd57255fa2a196706115cea9a1:7c0c01763321d8d3fc16969420526bc0d299dd3413ab0317a3122a6dc2abdfc17';

    // 1. Update password
    const updateRes = await client.query(
      `UPDATE public.users
          SET password_hash = $1,
              token_version = COALESCE(token_version, 0) + 1
        WHERE email = $2
        RETURNING id`,
      [newHash, email]
    );

    if (updateRes.rowCount === 0) {
      console.error(`User ${email} not found in public.users.`);
      return;
    }
    const userId = updateRes.rows[0].id;
    console.log(`Password updated for ${email} (User ID: ${userId}).`);

    // 2. Check/Update profile group
    const profileRes = await client.query(
      `SELECT up.group_id, ug.name as group_name 
       FROM public.user_profiles up
       LEFT JOIN public.user_groups ug ON ug.id = up.group_id
       WHERE up.id = $1`,
      [userId]
    );

    if (profileRes.rowCount === 0) {
      console.log('Profile not found. Creating one as Administrador...');
      const adminGroupRes = await client.query("SELECT id FROM public.user_groups WHERE name = 'Administrador'");
      const adminGroupId = adminGroupRes.rows[0]?.id;
      if (adminGroupId) {
        await client.query(
          "INSERT INTO public.user_profiles (id, group_id) VALUES ($1, $2)",
          [userId, adminGroupId]
        );
        console.log('Profile created with Administrador group.');
      }
    } else {
      const currentGroup = profileRes.rows[0].group_name;
      console.log(`Current group: ${currentGroup}`);
      if (currentGroup !== 'Administrador') {
        const adminGroupRes = await client.query("SELECT id FROM public.user_groups WHERE name = 'Administrador'");
        const adminGroupId = adminGroupRes.rows[0]?.id;
        if (adminGroupId) {
          await client.query(
            "UPDATE public.user_profiles SET group_id = $1 WHERE id = $2",
            [adminGroupId, userId]
          );
          console.log('Group updated to Administrador.');
        }
      }
    }
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await client.end();
  }
}

run();
