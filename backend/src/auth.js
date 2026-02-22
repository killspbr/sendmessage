import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db.js';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-mudar-em-producao';

/**
 * Middleware para proteger rotas
 */
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }
        req.user = user;
        next();
    });
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

        // Verifica se usuário já existe
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [email, passwordHash, name]
        );

        const user = result.rows[0];

        // Cria perfil automaticamente. 
        // Se for o PRIMEIRO usuário do sistema, torna-o Administrador.
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

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user, token });
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

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: { id: user.id, email: user.email, name: user.name },
            token
        });
    } catch (error) {
        console.error('[Auth] Erro no login:', error);
        res.status(500).json({ error: 'Erro interno ao fazer login.' });
    }
};
