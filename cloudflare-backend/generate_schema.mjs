import fs from 'fs';

const schema = JSON.parse(fs.readFileSync('production_schema.json', 'utf8'));

let sql = `
-- BASE_NEON_SCHEMA.sql
-- Proposito: Schema baseline para Neon Postgres (SendMessage)
-- Gerado em: ${new Date().toISOString()}

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`;

// Helper for type conversion if needed (Neon is Postgres so mostly 1:1)
function getBaseType(type) {
    if (type.includes('timestamp')) return 'TIMESTAMP WITH TIME ZONE';
    if (type === 'integer') return 'INTEGER';
    if (type === 'bigint') return 'BIGINT';
    if (type === 'numeric') return 'NUMERIC';
    if (type === 'boolean') return 'BOOLEAN';
    if (type === 'jsonb') return 'JSONB';
    if (type === 'text') return 'TEXT';
    if (type === 'uuid') return 'UUID';
    if (type === 'date') return 'DATE';
    if (type === 'time without time zone') return 'TIME';
    if (type === 'bytea') return 'BYTEA';
    return type.toUpperCase();
}

for (const [tableName, columns] of Object.entries(schema)) {
    sql += `-- Table: ${tableName}\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
    
    const colDefs = columns.map(col => {
        let def = `  ${col.name} ${getBaseType(col.type)}`;
        if (!col.nullable) def += ' NOT NULL';
        if (col.default) {
            // Normalize defaults
            let d = col.default;
            if (d.includes('nextval')) {
                if (tableName === 'contacts' && col.name === 'id') {
                    def = `  ${col.name} BIGSERIAL`; // Simplified for new schema
                } else if (col.name === 'id') {
                    def = `  ${col.name} SERIAL`;
                }
            } else {
                def += ` DEFAULT ${d}`;
            }
        }
        return def;
    });

    // Check for missing updated_at / created_at
    const hasCreatedAt = columns.some(c => c.name === 'created_at');
    const hasUpdatedAt = columns.some(c => c.name === 'updated_at');

    if (!hasCreatedAt) {
        colDefs.push(`  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
    }
    if (!hasUpdatedAt) {
        colDefs.push(`  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
    }

    // Identify Primary Keys (usually 'id' or 'group_id'/'permission_id' for junction tables)
    if (tableName === 'group_permissions') {
         sql += colDefs.join(',\n') + ',\n  PRIMARY KEY (group_id, permission_id)\n);\n\n';
    } else if (tableName === 'active_user_sessions') {
         sql += colDefs.join(',\n') + ',\n  PRIMARY KEY (session_id)\n);\n\n';
    } else {
        const pk = columns.find(c => c.name === 'id') || columns[0];
        sql += colDefs.join(',\n') + `,\n  PRIMARY KEY (${pk.name})\n);\n\n`;
    }

    // Add indexes for common queries
    if (columns.some(c => c.name === 'user_id')) {
        sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_user_id ON public.${tableName}(user_id);\n`;
    }
    if (columns.some(c => c.name === 'email') && tableName === 'users') {
        sql += `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);\n`;
    }
    sql += '\n';
}

fs.writeFileSync('BASE_NEON_SCHEMA.sql', sql);
console.log('BASE_NEON_SCHEMA.sql gerado com sucesso!');
