/**
 * Auth Service
 * * Gestiona exclusivamente la autenticación de usuarios (Login/Logout).
 * * Solo importa la sesión.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export class AuthService {
    private client: SupabaseClient;

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    /**
     * Iniciar sesión con Email y Contraseña
     */
    async login(email: string, password: string) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        })

        if (error) throw error
        return data
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        const { error } = await this.client.auth.signOut()
        if (error) throw error
    }
}
