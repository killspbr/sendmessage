
import { ContactsService } from '../services/contactsService.js';

export const ContactsController = {
    async importSingle(req, res, next) {
        try {
            const userId = req.user ? req.user.id : null;
            const { list_id } = req.body;
            
            console.log(`[Controller DEBUG] Importação: User=${userId}, List=${list_id}, Name=${req.body.name}`);

            if (!userId) {
                const err = new Error('Usuário não autenticado');
                err.status = 401;
                err.code = 'UNAUTHORIZED';
                throw err;
            }

            const contact = await ContactsService.importContact(userId, list_id, req.body);
            
            res.status(201).json({
                success: true,
                message: 'Contato importado com sucesso',
                data: contact,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            // Repassa para o middleware de erro global
            next(error); 
        }
    }
};
