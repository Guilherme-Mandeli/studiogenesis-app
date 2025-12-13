<script setup lang="ts">
import { AuthService } from '../../services/auth.service'

// Instancias
const client = useSupabaseClient()
const authService = new AuthService(client)
const router = useRouter()

// Estados
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  email: '',
  password: ''
})

// Helper para traducir errores de Supabase
const translateError = (message: string) => {
  const msg = message.toLowerCase()
  if (msg.includes('invalid login credentials')) return 'Credenciales incorrectas. Verifica tu correo y contraseña.'
  if (msg.includes('email not confirmed')) return 'Tu correo electrónico no ha sido confirmado.'
  if (msg.includes('missing email or phone')) return 'Debes introducir un correo electrónico.' // Corrección específica solicitada
  if (msg.includes('password contains')) return 'La contraseña es demasiado corta o no cumple los requisitos.'
  
  return 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.'
}

// Login
const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    await authService.login(form.email, form.password)
    // Si sale bien, redirigir al Dashboard (Home)
    router.push('/')
  } catch (error: any) {
    console.error('Login Error:', error)
    errorMsg.value = translateError(error.message || '')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="p-card_padding space-y-card_padding bg-surface shadow-md rounded-lg">

    <template #header>
      <div>
        <h1 class="text-headline_large font-bold text-onSurface">Acceso Admin</h1>
        <p class="text-body_large text-onSurface opacity-80 mt-1">Introduce tus credenciales</p>
      </div>
    </template>

    <form @submit.prevent="handleLogin" class="space-y-6">

      <UAlert
        v-if="errorMsg"
        :title="errorMsg"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="subtle"
      />

      <UFormGroup label="Correo Electrónico">
        <UInput
          v-model="form.email"
          type="email"
          placeholder="admin@genesis.com"
          class="rounded-sm"
        />
      </UFormGroup>

      <UFormGroup label="Contraseña">
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          class="rounded-sm"
        />
      </UFormGroup>

      <UButton
        type="submit"
        block
        :loading="loading"
        color="primary"
        class="h-button_h px-button_px rounded-sm bg-primary text-onPrimary font-medium shadow-sm hover:bg-primary/90 active:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-200 ease-in-out flex items-center justify-center gap-2 select-none"
      >
        Entrar
      </UButton>
    </form>

  </UCard>
</template>


