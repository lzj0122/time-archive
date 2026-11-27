import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/motion.css'
import './styles/base.css'
import './styles/archive-home.css'
import './styles/archive-event.css'
import './styles/content-dev.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
