
import { ContactsRepository } from '../repositories/contactsRepository.js';

export const ContactsService = {
    async importContact(userId, listId, body) {
        // Validação estrita de UUID (Blindagem UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const cleanUserId = String(userId).trim();
        const cleanListId = String(listId).trim();

        if (!uuidRegex.test(cleanUserId) || !uuidRegex.test(cleanListId)) {
            const err = new Error('Formato de ID inválido (UUID esperado)');
            err.status = 400;
            err.code = 'INVALID_UUID';
            err.detail = `User: "${cleanUserId}", List: "${cleanListId}"`;
            throw err;
        }

        // Validação campos obrigatórios
        if (!body.name) {
            const err = new Error('Campo "name" é obrigatório');
            err.status = 400;
            err.code = 'MISSING_REQUIRED_FIELD';
            throw err;
        }

        // 1. Verificar duplicidade
        const existing = await ContactsRepository.findExisting(cleanUserId, cleanListId, body.name, body.phone);
        if (existing.rows.length > 0) {
            const err = new Error('Contato já existe nesta lista');
            err.status = 409;
            err.code = 'DUPLICATE_CONTACT';
            err.detail = `ID existente: ${existing.rows[0].id}`;
            throw err;
        }

        // 2. Inserir
        const result = await ContactsRepository.insert(cleanUserId, cleanListId, body);
        return result.rows[0];
    }
};
