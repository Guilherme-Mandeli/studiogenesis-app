<script setup lang="ts">
/**
 * Appointments / Calendar Page
 * 
 * Muestra un calendario mensual con las citas/pedidos.
 */
import { AppointmentService } from '~/services/AppointmentService'
import type { Appointment } from '~/types'
import AppointmentForm from '~/components/appointments/AppointmentForm.vue'
import { startOfMonth, endOfMonth, format } from 'date-fns'

definePageMeta({
  layout: 'admin'
})

const client = useSupabaseClient()
const service = new AppointmentService(client)

// State
const appointments = ref<Appointment[]>([])
const loading = ref(false)
const currentDate = ref(new Date())

// Modal State
const isModalOpen = ref(false)
const selectedAppointmentId = ref<number | undefined>(undefined)
const selectedDate = ref<Date | undefined>(undefined)

// Setup attributes for v-calendar
const attributes = computed(() => [
    ...appointments.value.map(apt => ({
        key: apt.id,
        dot: getColor(apt.status),
        dates: new Date(apt.date),
        popover: {
            label: `${apt.product?.name || 'Producto'} (x${apt.units})`,
            visibility: 'hover'
        },
        customData: apt
    }))
])

const getColor = (status: string) => {
    switch(status) {
        case 'pending': return 'orange'
        case 'confirmed': return 'green'
        case 'completed': return 'blue'
        case 'cancelled': return 'red'
        default: return 'gray'
    }
}

// Fetch data
const fetchAppointments = async (date: Date) => {
    loading.value = true
    try {
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const res = await service.getByMonth(month, year)
        appointments.value = res
    } catch (e) {
        console.error('Error fetching appointments', e)
    } finally {
        loading.value = false
    }
}

// Initial load
onMounted(() => {
    fetchAppointments(currentDate.value)
})

// Handlers
const onDayClick = (day: any) => {
    selectedAppointmentId.value = undefined
    selectedDate.value = day.date
    isModalOpen.value = true
}

const onEventClick = (apt: Appointment) => {
    selectedAppointmentId.value = apt.id
    selectedDate.value = undefined
    isModalOpen.value = true
}

// Note: V-Calendar doesn't emit 'event-click' directly in standard config easily without customs slots.
// We will use the 'day-click' and check attributes, or custom content.
// Simpler approach for V1: Just Day click -> List events in that day OR Create New.
// But better UX: Day click -> Creates new. Hover shows info. 

// To Edit, we might need a list on the side or a way to click dots. 
// V-Calendar 'attributes' doesn't have a direct click handler in standard api easily exposed to top level unless using slots.
// Let's us the slot #day-content to render custom dots/bars that are clickable if needed, 
// OR just rely on the Popover to show info, and maybe clicking the day opens the modal which could ask "Edit existing or Create new" 
// IF there are events.
// A simpler iteration for this component:
// Click Day -> Open Modal to Create.
// To Edit -> we list the appointments of the month below or sidebar? 
// OR better: Clicking the attribute popover *could* work if we render custom html.

// Let's Try: Using the day slot to render interactions.
// OR simpler: Just list the appointments for the selected day in a side panel?
// Requirement says: "Once saved... should show in calendar".
// Let's assume just viewing is fine on calendar, editing might be via a list view below or day interaction.

// Let's stick to standard v-calendar behavior:
// We will use `@dayclick` to open the "Create" form.
// If there are appointments on that day, maybe we show a small list within the modal or before opening form?
// For now: Click on day = Create New for that day.
// To Edit: I will add a List View below the calendar for the selected month's items.

// Update: Actually `v-calendar` attributes DO support `customData`. 
// We can use the `#day-popover` slot or just list them.

// For this iteration:
// 1. Calendar View
// 2. Click Day -> Open Create Modal prefilled with date.
// 3. List of appointments for current month below calendar (table) to allow Editing/Deleting.

const handlePageChange = (pages: any[]) => {
    if (pages.length > 0) {
        const { month, year } = pages[0]
        // Update current date/fetch
        const newDate = new Date(year, month - 1, 1)
        currentDate.value = newDate
        fetchAppointments(newDate)
    }
}

const handleSaved = () => {
    fetchAppointments(currentDate.value)
}

const handleEdit = (apt: Appointment) => {
    selectedAppointmentId.value = apt.id
    selectedDate.value = undefined
    isModalOpen.value = true
}

// Table columns for list view
const columns = [
    { key: 'date', label: 'Fecha' },
    { key: 'product.name', label: 'Producto' },
    { key: 'units', label: 'Unidades' },
    { key: 'total_cost', label: 'Total' },
    { key: 'status', label: 'Estado' },
    { key: 'actions' }
]
</script>

<template>
    <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Calendar Section -->
        <div class="lg:col-span-2 space-y-4">
             <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold text-gray-800">Calendario de Citas</h1>
                <UButton icon="i-heroicons-plus" color="black" @click="() => { selectedAppointmentId=undefined; selectedDate=new Date(); isModalOpen=true }">
                    Nueva Cita
                </UButton>
            </div>

            <UCard>
                <VCalendar 
                    expanded 
                    borderless
                    transparent
                    :attributes="attributes"
                    @did-move="handlePageChange"
                    @dayclick="onDayClick"
                />
            </UCard>
        </div>

        <!-- List/Details Section -->
        <div class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-700">Citas del Mes</h2>
            <UCard :ui="{ body: { padding: 'p-0' } }">
                <UTable 
                    :rows="appointments" 
                    :columns="columns"
                    :loading="loading"
                    class="w-full"
                >
                    <template #date-data="{ row }">
                        {{ format(new Date(row.date), 'dd/MM') }}
                    </template>
                    <template #total_cost-data="{ row }">
                        {{ row.total_cost?.toFixed(2) }}€
                    </template>
                    <template #status-data="{ row }">
                         <UBadge :color="getColor(row.status)" variant="subtle" size="xs">{{ row.status }}</UBadge>
                    </template>
                    <template #actions-data="{ row }">
                        <UButton color="gray" variant="ghost" icon="i-heroicons-pencil-square" size="xs" @click="handleEdit(row)" />
                    </template>
                </UTable>
            </UCard>
        </div>

        <AppointmentForm 
            v-model="isModalOpen"
            :appointment-id="selectedAppointmentId"
            :initial-date="selectedDate"
            @saved="handleSaved"
        />
    </div>
</template>
