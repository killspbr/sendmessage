const { Client } = require('pg');
const connectionString = 'postgres://clrodriguesuser:>:0fm3jcT77ZZjYMqqwb@easypanel.soepinaobasta.com:5433/sendmessage?sslmode=disable';

async function checkIndices() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const tables = ['user_profiles', 'user_groups'];
    for (const table of tables) {
      const res = await client.query(`
        SELECT
            t.relname as table_name,
            i.relname as index_name,
            a.attname as column_name
        FROM
            pg_class t,
            pg_class i,
            pg_index ix,
            pg_attribute a
        WHERE
            t.oid = ix.indrelid
            AND i.oid = ix.indexrelid
            AND a.attrelid = t.oid
            AND a.attnum = ANY(ix.indkey)
            AND t.relkind = 'r'
            AND t.relname = $1
        ORDER BY
            t.relname,
            i.relname;
      `, [table]);
      console.log(`Table ${table}:`, JSON.stringify(res.rows, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkIndices();
