<script setup lang="ts">
/**
 * Página de Citas / Calendario
 * 
 * Nuevo diseño:
 * - Arriba Izquierda: Calendario (Vista Mensual)
 * - Arriba Derecha: Agenda (Próximas/Pendientes)
 * - Abajo: Pestañas (Futuras/Pasadas) con Tablas
 */
import { AppointmentService } from '~/services/AppointmentService'
import type { Appointment } from '~/types'
import AppointmentForm from '~/components/appointments/AppointmentForm.vue'
import { startOfMonth, endOfMonth, format, isAfter, isBefore } from 'date-fns'

definePageMeta({
  layout: 'admin'
})

const client = useSupabaseClient()
const service = new AppointmentService(client)

// Estado
const monthAppointments = ref<Appointment[]>([]) // Para los puntos del calendario
const agendaAppointments = ref<Appointment[]>([]) // Para la barra lateral
const tableAppointments = ref<Appointment[]>([]) // Para la tabla inferior
const totalItems = ref(0)
const loading = ref(false)

// Estado del Calendario
const currentDate = ref(new Date())

// Estado de las Pestañas
const activeTab = ref(0) // 0: Futuras, 1: Pasadas
const page = ref(1)
const pageSize = 10

// Estado del Modal
const isModalOpen = ref(false)
const selectedAppointmentId = ref<number | undefined>(undefined)
const selectedDate = ref<Date | undefined>(undefined)

const items = [{
    label: 'Citas Futuras',
    icon: 'i-heroicons-calendar-days',
    slot: 'future'
}, {
    label: 'Citas Pasadas',
    icon: 'i-heroicons-clock',
    slot: 'past'
}]

// --- Computed ---

// Atributos de V-Calendar
const attributes = computed(() => {
    return monthAppointments.value.map(apt => ({
        key: apt.id,
        dot: getColor(apt.status),
        dates: new Date(apt.date),
        popover: {
            label: `${apt.product?.name || 'Producto'} (${getStatusLabel(apt.status)})`,
            visibility: 'hover'
        },
        customData: apt
    }))
})

// Columnas de la tabla
const columns = [
    { key: 'date', label: 'Fecha' },
    { key: 'product.name', label: 'Producto' },
    { key: 'units', label: 'Unidades' },
    { key: 'total_cost', label: 'Total' },
    { key: 'status', label: 'Estado' },
    { key: 'actions' }
]

// --- Helpers ---

const getColor = (status: string) => {
    switch(status) {
        case 'pending': return 'orange'
        case 'confirmed': return 'green'
        case 'completed': return 'blue'
        case 'cancelled': return 'red'
        default: return 'gray'
    }
}

const getStatusLabel = (status: string) => {
     switch(status) {
        case 'pending': return 'Pendiente'
        case 'confirmed': return 'Confirmada'
        case 'completed': return 'Concluida'
        case 'cancelled': return 'Cancelada'
        default: return status
    }
}

// --- Fetch Actions ---

// 1. Obtener eventos para el calendario (puntos mensuales)
const fetchCalendarEvents = async (date: Date) => {
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    try {
        monthAppointments.value = await service.getByMonth(month, year)
    } catch (e) {
        console.error('Error calendar', e)
    }
}

// 2. Obtener agenda lateral (Futuras/Pendientes/Confirmadas, límite 5)
const fetchAgenda = async () => {
    try {
        agendaAppointments.value = await service.getFuture(5)
    } catch (e) {
        console.error('Error agenda', e)
    }
}

// 3. Obtener datos de la tabla inferior (Paginados)
const fetchTableData = async () => {
    loading.value = true
    try {
        const type = activeTab.value === 0 ? 'future' : 'past'
        const res = await service.getPaginated(type, page.value, pageSize)
        tableAppointments.value = res.data
        totalItems.value = res.count
    } catch (e) {
        console.error('Error table', e)
    } finally {
        loading.value = false
    }
}

const refreshAll = () => {
    fetchCalendarEvents(currentDate.value)
    fetchAgenda()
    fetchTableData()
}

// --- Lifecycle ---

onMounted(() => {
    refreshAll()
})

watch(() => activeTab.value, () => {
    page.value = 1
    fetchTableData()
})

watch(() => page.value, () => {
    fetchTableData()
})

// --- Handlers ---

const onPageChange = (pages: any[]) => {
    if (pages.length > 0) {
        const { month, year } = pages[0]
        const newDate = new Date(year, month - 1, 1)
        currentDate.value = newDate
        fetchCalendarEvents(newDate)
    }
}

const onDayClick = (day: any) => {
    selectedAppointmentId.value = undefined
    selectedDate.value = day.date
    isModalOpen.value = true
}

const handleEdit = (apt: Appointment) => {
    selectedAppointmentId.value = apt.id
    selectedDate.value = undefined
    isModalOpen.value = true
}

const toggleComplete = async (apt: Appointment) => {
    // Alternar estado: Si está pendiente/confirmada -> completada. Si está completada -> pendiente.
    // Esto permite marcar como hecho y deshacer la acción fácilmente.
    const newStatus = apt.status === 'completed' ? 'pending' : 'completed'
    try {
        await service.update(apt.id, { status: newStatus })
        refreshAll()
    } catch (e) {
        console.error(e)
        alert('Error al actualizar estado')
    }
}

</script>

<template>
    <div class="p-6 space-y-6">
        
        <!-- Encabezado -->
        <div class="flex justify-between items-center">
             <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Citas</h1>
             <UButton icon="i-heroicons-plus" color="black" @click="() => { selectedAppointmentId=undefined; selectedDate=new Date(); isModalOpen=true }">
                Nueva Cita
            </UButton>
        </div>

        <!-- Sección Superior: Calendario + Agenda -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            <!-- Calendario (2/3) -->
            <UCard class="xl:col-span-2 min-h-[400px]">
                 <template #header>
                    <h3 class="font-semibold text-gray-700 dark:text-gray-200">Calendario Mensual</h3>
                </template>
                <div class="flex justify-center h-full">
                     <VCalendar 
                        expanded 
                        borderless
                        transparent
                        :attributes="attributes"
                        @did-move="onPageChange"
                        @dayclick="onDayClick"
                    />
                </div>
            </UCard>

            <!-- Agenda (1/3) -->
            <UCard>
                <template #header>
                    <h3 class="font-semibold text-gray-700 dark:text-gray-200">Próximas y Pendientes</h3>
                </template>
                
                <div v-if="agendaAppointments.length === 0" class="text-gray-500 text-sm italic py-4 text-center">
                    No hay citas pendientes próximas.
                </div>

                <div class="space-y-3">
                    <div 
                        v-for="apt in agendaAppointments" 
                        :key="apt.id" 
                        class="p-3 bg-gray-50 dark:bg-gray-800 border-l-4 border-l-orange-500 flex justify-between items-start group hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <div>
                            <div class="font-bold text-sm">{{ format(new Date(apt.date), 'dd/MM/yyyy') }}</div>
                            <div class="text-sm font-medium">{{ apt.product?.name }}</div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ getStatusLabel(apt.status) }} • {{ apt.total_cost }}€
                            </div>
                        </div>
                        <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <UButton 
                                size="2xs" 
                                icon="i-heroicons-pencil" 
                                color="gray" 
                                variant="ghost" 
                                @click="handleEdit(apt)"
                            />
                             <UTooltip text="Concluir">
                                <UButton 
                                    size="2xs" 
                                    icon="i-heroicons-check" 
                                    color="green" 
                                    variant="ghost" 
                                    @click="toggleComplete(apt)"
                                />
                             </UTooltip>
                        </div>
                    </div>
                </div>
            </UCard>
        </div>

        <!-- Sección Inferior: Pestañas y Tabla -->
        <UCard :ui="{ body: { padding: 'p-0' } }">
            <UTabs :items="items" v-model="activeTab" class="w-full">
                <!-- Encabezado personalizado si es necesario, por defecto usa items -->
            </UTabs>

            <div class="p-4 border-t dark:border-gray-700">
                <UTable 
                    :rows="tableAppointments" 
                    :columns="columns"
                    :loading="loading"
                    class="w-full"
                >
                    <template #date-data="{ row }">
                        {{ format(new Date(row.date), 'dd/MM/yyyy') }}
                    </template>
                    <template #total_cost-data="{ row }">
                        {{ row.total_cost?.toFixed(2) }}€
                    </template>
                    <template #status-data="{ row }">
                         <UBadge :color="getColor(row.status)" variant="subtle" size="xs">
                            {{ getStatusLabel(row.status) }}
                        </UBadge>
                    </template>
                    <template #actions-data="{ row }">
                        <div class="flex items-center gap-2">
                            <UButton color="gray" variant="ghost" icon="i-heroicons-pencil-square" size="xs" @click="handleEdit(row)" />
                            
                            <!-- Botón para alternar estado completado -->
                            <UButton 
                                :icon="row.status === 'completed' ? 'i-heroicons-arrow-uturn-left' : 'i-heroicons-check-circle'"
                                :color="row.status === 'completed' ? 'gray' : 'green'"
                                variant="ghost"
                                size="xs"
                                :title="row.status === 'completed' ? 'Reabrir' : 'Concluir'"
                                @click="toggleComplete(row)"
                            />
                        </div>
                    </template>
                </UTable>

                <!-- Paginación -->
                <div class="flex justify-end pt-4">
                    <UPagination v-model="page" :page-count="pageSize" :total="totalItems" />
                </div>
            </div>
        </UCard>

        <!-- Formulario Modal -->
        <AppointmentForm 
            v-model="isModalOpen"
            :appointment-id="selectedAppointmentId"
            :initial-date="selectedDate"
            @saved="refreshAll"
        />

    </div>
</template>
