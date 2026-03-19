
import { query } from '../db.js';

export const ContactsRepository = {
    async findExisting(userId, listId, name, phone) {
        const sql = 'SELECT id FROM contacts WHERE user_id = $1 AND list_id = $2 AND (name = $3 OR (phone = $4 AND phone != \'\')) LIMIT 1';
        return query(sql, [userId, listId, name, phone || '']);
    },

    async insert(userId, listId, data) {
        const sql = `
          INSERT INTO contacts (
            user_id, list_id, name, phone, email, category, cep, rating, 
            address, city, state, instagram, facebook, whatsapp, website
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
          RETURNING *`;
        
        const values = [
            userId, listId, data.name, data.phone || '', data.email || '', data.category || '', 
            data.cep || '', data.rating || '', data.address || '', data.city || '', data.state || '', 
            data.instagram || '', data.facebook || '', data.whatsapp || '', data.website || ''
        ];
        
        return query(sql, values);
    }
};
