import { setupCalendar, Calendar, DatePicker } from 'v-calendar';
import 'v-calendar/style.css';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(setupCalendar, {})

    // Use specific components if needed globally
    nuxtApp.vueApp.component('VCalendar', Calendar)
    nuxtApp.vueApp.component('VDatePicker', DatePicker)
});
