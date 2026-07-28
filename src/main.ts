import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Icon, addCollection } from '@iconify/vue'
import App from './App.vue'
import router from './router'
import './style.css'

import ph from '../src/data/ph-icons.json'
addCollection(ph)

const app = createApp(App)

app.component('Icon', Icon)
app.use(createPinia())
app.use(router)

app.mount('#app')
