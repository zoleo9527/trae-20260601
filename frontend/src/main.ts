import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import { useReplacementsStore } from './stores/replacements'
import { useOperationsStore } from './stores/operations'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const operationsStore = useOperationsStore()
const userStore = useUserStore()
const replacementsStore = useReplacementsStore()

operationsStore.initLogs()
userStore.initUser()
replacementsStore.initReplacements()

app.mount('#app')
