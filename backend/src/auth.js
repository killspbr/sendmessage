import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db.js';
import crypto from 'crypto';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-mudar-em-producao';

/**
 * Middleware para proteger rotas.
 * Valida o JWT e verifica se o token_version ainda é válido no banco.
 */
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    try {
        // Verifica se o token_version do JWT ainda bate com o banco
        const result = await query('SELECT token_version FROM users WHERE id = $1', [decoded.id]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        // Se o token carrega uma versão mais antiga, a sessão foi invalidada
        if (decoded.tv !== undefined && decoded.tv !== user.token_version) {
            return res.status(401).json({ error: 'Sessão invalidada. Faça login novamente.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('[Auth] Erro ao validar token_version:', error);
        return res.status(500).json({ error: 'Erro interno ao validar sessão.' });
    }
};

/**
 * Middleware para o scheduler autenticar via Chave Secreta
 */
export const authenticateScheduler = async (req, res, next) => {
    const scheduledKey = req.headers['x-scheduled-key'];
    const schedulerSecret = process.env.SCHEDULER_SECRET || 'scheduler-secret-123';

    if (scheduledKey && scheduledKey === schedulerSecret) {
        const userId = req.headers['x-scheduled-user-id'];
        if (userId) {
            req.user = { id: userId };
            return next();
        }
    }
    
    return authenticateToken(req, res, next);
};

/**
 * Registra um novo usuário
 */
export const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, token_version',
            [email, passwordHash, name]
        );

        const user = result.rows[0];

        // Primeiro usuário vira Administrador
        const userCount = await query('SELECT count(*) FROM users');
        const isFirstUser = parseInt(userCount.rows[0].count) === 1;

        if (isFirstUser) {
            const adminGroup = await query("SELECT id FROM user_groups WHERE name = 'Administrador'");
            if (adminGroup.rows.length > 0) {
                await query(
                    'INSERT INTO user_profiles (id, group_id) VALUES ($1, $2)',
                    [user.id, adminGroup.rows[0].id]
                );
            } else {
                await query('INSERT INTO user_profiles (id) VALUES ($1)', [user.id]);
            }
        } else {
            await query('INSERT INTO user_profiles (id) VALUES ($1)', [user.id]);
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, tv: user.token_version },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
    } catch (error) {
        console.error('[Auth] Erro no signup:', error);
        res.status(500).json({ error: 'Erro interno ao criar conta.' });
    }
};

/**
 * Login de usuário existente
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }

        // Inclui tv (token_version) no payload para validação posterior
        const token = jwt.sign(
            { id: user.id, email: user.email, tv: user.token_version },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: { id: user.id, email: user.email, name: user.name },
            token
        });
    } catch (error) {
        console.error('[Auth] Erro no login:', error);
        res.status(500).json({ error: 'Erro interno ao fazer login.' });
    }
};

/**
 * Solicita redefinição de senha
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await query('SELECT id FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.json({ ok: true, message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000);

        await query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [token, expires, user.id]
        );

        console.log(`[AUTH] Link de redefinição para ${email}: http://localhost:3000/reset-password/${token}`);

        res.json({ ok: true, message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.' });
    } catch (error) {
        console.error('[Auth] Erro no forgotPassword:', error);
        res.status(500).json({ error: 'Erro interno ao processar redefinição.' });
    }
};

/**
 * Define nova senha usando token de redefinição
 */
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const result = await query(
            'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Token inválido ou expirado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [passwordHash, user.id]
        );

        res.json({ ok: true, message: 'Senha alterada com sucesso.' });
    } catch (error) {
        console.error('[Auth] Erro no resetPassword:', error);
        res.status(500).json({ error: 'Erro interno ao alterar senha.' });
    }
};

/**
 * Middleware — verifica se o usuário autenticado é Administrador
 */
export const checkAdmin = async (req, res, next) => {
    try {
        const result = await query(`
            SELECT g.name 
            FROM user_profiles p
            JOIN user_groups g ON p.group_id = g.id
            WHERE p.id = $1
        `, [req.user.id]);

        if (result.rows.length > 0 && result.rows[0].name === 'Administrador') {
            next();
        } else {
            res.status(403).json({ success: false, error: 'Acesso restrito a administradores.' });
        }
    } catch (error) {
        console.error('[Auth] Erro ao verificar admin:', error);
        res.status(500).json({ success: false, error: 'Erro interno ao validar permissões.' });
    }
};

/**
 * Reseta a senha de um usuário para '123456' e invalida as sessões dele (Admin)
 */
export const resetUserPasswordToDefault = async (req, res) => {
    try {
        const { id } = req.params;
        const defaultPassword = '123456';

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(defaultPassword, salt);

        // Invalida sessões incrementando token_version
        await query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, token_version = token_version + 1 WHERE id = $2',
            [passwordHash, id]
        );

        res.json({ success: true, message: `Senha do usuário resetada para "${defaultPassword}" e sessões invalidadas.` });
    } catch (error) {
        console.error('[Auth] Erro ao resetar senha do usuário:', error);
        res.status(500).json({ success: false, error: 'Erro interno ao resetar senha.' });
    }
};

/**
 * Invalida as sessões de um usuário específico (Admin)
 */
export const invalidateUserSessions = async (req, res) => {
    try {
        const { id } = req.params;

        await query(
            'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
            [id]
        );

        res.json({ success: true, message: 'Sessões do usuário invalidadas com sucesso.' });
    } catch (error) {
        console.error('[Auth] Erro ao invalidar sessões do usuário:', error);
        res.status(500).json({ success: false, error: 'Erro ao invalidar sessões.' });
    }
};

/**
 * Invalida as sessões de TODOS os usuários (Admin)
 */
export const invalidateAllSessions = async (req, res) => {
    try {
        await query('UPDATE users SET token_version = token_version + 1');

        res.json({ success: true, message: 'Sessões de todos os usuários invalidadas com sucesso.' });
    } catch (error) {
        console.error('[Auth] Erro ao invalidar todas as sessões:', error);
        res.status(500).json({ success: false, error: 'Erro ao invalidar sessões.' });
    }
};