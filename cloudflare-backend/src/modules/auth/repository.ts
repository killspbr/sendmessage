import { db } from '../../database/client'
import type { Bindings } from '../../types'

/**
 * AuthRepository (Domain: Users/Profiles)
 * Encapsula queries SQL para o domínio de autenticação.
 */
export class AuthRepository {
  /**
   * Busca usuário por e-mail.
   */
  static async findByEmail(env: Bindings, email: string) {
    const rows = await db.execute(env, 
      'SELECT * FROM public.users WHERE email = $1 LIMIT 1', 
      [email.toLowerCase().trim()]
    )
    return rows[0] || null
  }

  /**
   * Busca usuário por ID.
   */
  static async findById(env: Bindings, id: string) {
    const rows = await db.execute(env, 
      'SELECT id, email, name, token_version FROM public.users WHERE id = $1 LIMIT 1', 
      [id]
    )
    return rows[0] || null
  }

  /**
   * Cria novo usuário.
   */
  static async createUser(env: Bindings, { email, passwordHash, name }: { email: string, passwordHash: string, name: string | null }) {
    const rows = await db.execute(env,
      `INSERT INTO public.users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, token_version`,
      [email.toLowerCase().trim(), passwordHash, name]
    )
    return rows[0]
  }

  /**
   * Atualiza hash de senha (para migração progressiva).
   */
  static async updatePasswordHash(env: Bindings, userId: string, newHash: string) {
    await db.query(env, 'UPDATE public.users SET password_hash = $1 WHERE id = $2', [newHash, userId])
  }

  /**
   * Vincula usuário a um grupo de permissões.
   */
  static async assignToGroup(env: Bindings, userId: string, groupName: 'Administrador' | 'Usuário') {
    const groupRows = await db.execute(env, 'SELECT id FROM public.user_groups WHERE name = $1 LIMIT 1', [groupName])
    const groupId = groupRows[0]?.id
    
    if (groupId) {
      await db.query(env, 
        'INSERT INTO public.user_profiles (id, group_id) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id', 
        [userId, groupId]
      )
    } else {
      await db.query(env, 'INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [userId])
    }
  }

  /**
   * Conta total de usuários.
   */
  static async countUsers(env: Bindings): Promise<number> {
    const rows = await db.execute(env, 'SELECT COUNT(*)::int AS total FROM public.users')
    return rows[0]?.total || 0
  }
}
