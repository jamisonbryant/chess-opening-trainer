import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css'
import App from './App.vue'
import { useSettingsStore } from './stores/settings'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

const settings = useSettingsStore()
document.documentElement.dataset.theme = settings.theme
watch(() => settings.theme, (v) => {
  document.documentElement.dataset.theme = v
})
