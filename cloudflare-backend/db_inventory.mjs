import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

async function inventory() {
    const client = new Client({
        host: 'easypanel.soepinaobasta.com',
        port: 5433,
        user: 'clrodriguesuser',
        password: '>:0fm3jcT77ZZjYMqqwb',
        database: 'sendmessage',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const schema = {};
        
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        const tables = tablesRes.rows.map(r => r.table_name);
        
        for (const table of tables) {
            const colsRes = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            
            schema[table] = colsRes.rows.map(col => ({
                name: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
                default: col.column_default
            }));
        }
        
        fs.writeFileSync('production_schema.json', JSON.stringify(schema, null, 2));
        console.log('Schema salvo em production_schema.json');
        
    } catch (err) {
        console.error('Erro no inventário:', err.message);
    } finally {
        await client.end();
    }
}

inventory();
