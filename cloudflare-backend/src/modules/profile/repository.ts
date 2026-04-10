import { db } from '../../database/client'
import type { Bindings } from '../../types'

/**
 * ProfileRepository
 * Gerencia dados de perfil do usuário e configurações do sistema.
 */
export class ProfileRepository {
  /**
   * Busca perfil completo com nome do grupo.
   */
  static async getFullProfile(env: Bindings, userId: string) {
    const rows = await db.execute(env,
      `SELECT up.*, ug.name as group_name
         FROM public.user_profiles up
         LEFT JOIN public.user_groups ug ON up.group_id = ug.id
        WHERE up.id = $1
        LIMIT 1`,
      [userId]
    )
    return rows[0] || { id: userId }
  }

  /**
   * Busca códigos de permissão do usuário.
   */
  static async getPermissions(env: Bindings, userId: string): Promise<string[]> {
    const rows = await db.execute(env,
      `SELECT p.code
         FROM public.group_permissions gp
         JOIN public.permissions p ON gp.permission_id = p.id
         JOIN public.user_profiles up ON up.group_id = gp.group_id
        WHERE up.id = $1`,
      [userId]
    )
    return rows.map(r => r.code)
  }

  /**
   * Atualiza perfil do usuário.
   */
  static async updateProfile(env: Bindings, userId: string, data: any) {
    const fields: string[] = []
    const values: any[] = []
    let i = 1

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${i++}`)
        values.push(val)
      }
    }

    if (fields.length === 0) return

    values.push(userId)
    await db.query(env, 
      `UPDATE public.user_profiles SET ${fields.join(', ')} WHERE id = $${i}`, 
      values
    )
  }

  /**
   * Busca configurações globais do app.
   */
  static async getAppSettings(env: Bindings) {
    const rows = await db.execute(env, 'SELECT * FROM public.app_settings LIMIT 1')
    return rows[0] || {}
  }

  /**
   * Atualiza ou cria configurações globais.
   */
  static async updateAppSettings(env: Bindings, data: any) {
    const check = await db.execute(env, 'SELECT id FROM public.app_settings LIMIT 1')
    const fields: string[] = []
    const values: any[] = []
    let i = 1

    for (const [key, val] of Object.entries(data)) {
      fields.push(`${key} = $${i++}`)
      values.push(val)
    }

    if (check.length > 0) {
      values.push(check[0].id)
      return db.execute(env, 
        `UPDATE public.app_settings SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, 
        values
      )
    } else {
      const columns = Object.keys(data).join(', ')
      const placeholders = Object.keys(data).map((_, idx) => `$${idx + 1}`).join(', ')
      return db.execute(env, 
        `INSERT INTO public.app_settings (${columns}) VALUES (${placeholders}) RETURNING *`, 
        values
      )
    }
  }
}
