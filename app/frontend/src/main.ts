import { createApp } from 'vue'; // Correct import for Vue 3

import './style.css'
import App from './App.vue';
import { router } from './App.vue'


createApp(App)
    .use(router)
    .mount('#app')
