<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()
const route = useRoute()

// Computed logic to control auto-expansion of sidebar groups
const accordionItems = computed(() => {
    const isProductsActive = route.path.startsWith('/products')
    return [{ 
        label: 'Productos', 
        icon: 'i-heroicons-cube', 
        slot: 'products',
        defaultOpen: isProductsActive
    }]
})

// Key to force re-render/re-eval of defaultOpen when section context changes
const activeSection = computed(() => {
    if (route.path.startsWith('/products')) return 'products'
    return 'none'
})



const logout = async () => {
  // Clear dev token
  const devToken = useCookie('dev_token')
  devToken.value = null

  // Try Supabase logout
  await client.auth.signOut()
  
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed h-full z-10">
      
      <!-- Header -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <span class="text-xl font-bold text-gray-800 dark:text-white">StudioGenesis</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <UButton
          to="/"
          variant="ghost"
          color="gray"
          block
          class="justify-start text-base font-normal hover:bg-gray-100 dark:hover:bg-gray-700"
          active-class="bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400 font-medium"
        >
          <template #leading>
            <UIcon name="i-heroicons-home" class="w-5 h-5" />
          </template>
          Inicio
        </UButton>

        <!-- Products Group -->
        <UAccordion 
          :key="activeSection"
          :items="accordionItems"
          :ui="{ wrapper: 'w-full', item: { padding: 'pt-0 pb-0' } }"
        >
          <template #default="{ item, open }">
            <UButton
              variant="ghost"
              color="gray"
              block
              class="justify-between text-base font-normal hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="[open ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400']"
            >
              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" class="w-5 h-5" />
                <span>{{ item.label }}</span>
              </div>
              <UIcon
                name="i-heroicons-chevron-right"
                class="w-4 h-4 transition-transform duration-200"
                :class="[open && 'transform rotate-90']"
              />
            </UButton>
          </template>

          <template #products>
            <div class="pl-4 space-y-1 mt-1 bg-gray-50/50 border-l-2 border-gray-100 ml-2">
              <UButton
                to="/products"
                variant="ghost"
                color="gray"
                block
                class="justify-start text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700"
                active-class="!text-black !font-semibold bg-gray-100"
                :exact="true"
              >
                Todos los productos
              </UButton>
              <UButton
                to="/products/create"
                variant="ghost"
                color="gray"
                block
                class="justify-start text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700"
                active-class="!text-black !font-semibold bg-gray-100"
              >
                Nuevo producto
              </UButton>
              <UButton
                to="/products/categories"
                variant="ghost"
                color="gray"
                block
                class="justify-start text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700"
                active-class="!text-black !font-semibold bg-gray-100"
              >
                Categorías
              </UButton>
            </div>
          </template>
        </UAccordion>

        <UButton
          to="/appointments"
          variant="ghost"
          color="gray"
          block
          class="justify-start text-base font-normal hover:bg-gray-100 dark:hover:bg-gray-700"
          active-class="bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400 font-medium"
        >
          <template #leading>
            <UIcon name="i-heroicons-calendar" class="w-5 h-5" />
          </template>
          Citas
        </UButton>
      </nav>

      <!-- Footer / Logout -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <UButton
          color="red"
          variant="ghost"
          block
          class="justify-start hover:bg-red-50 dark:hover:bg-red-900/20"
          @click="logout"
        >
          <template #leading>
            <UIcon name="i-heroicons-arrow-left-on-rectangle" class="w-5 h-5" />
          </template>
          Cerrar Sesión
        </UButton>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 ml-64 p-8">
      <slot />
    </main>
  </div>
</template>
