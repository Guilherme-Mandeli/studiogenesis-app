/**
 * Global Auth Middleware
 * * Este archivo se ejecuta antes de entrar a CUALQUIER página.
 * * Objetivo: Proteger la aplicación. Si no tienes sesión, te manda al Login.
 */

export default defineNuxtRouteMiddleware((to, from) => {
    const user = useSupabaseUser()
    const devToken = useCookie('dev_token')

    // Check if user is authenticated via Supabase OR has a dev token
    const isAuthenticated = user.value || devToken.value === 'true'

    // 1. Si el usuario YA está logueado y quiere ir al Login, lo mandamos al Home.
    if (isAuthenticated && to.path === '/login') {
        return navigateTo('/')
    }

    // 2. Si el usuario NO está logueado y quiere ir a cualquier sitio que no sea login...
    if (!isAuthenticated && to.path !== '/login') {
        // ...lo mandamos al Login.
        return navigateTo('/login')
    }
})
