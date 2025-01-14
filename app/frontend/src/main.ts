import { createApp } from 'vue'; // Correct import for Vue 3

import './style.css'
import App from './App.vue';
import router from './App.vue';
import vue3GoogleLogin from 'vue3-google-login'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID 
console.log(CLIENT_ID)
createApp(App)
    .use(vue3GoogleLogin,{
        clientId:CLIENT_ID
    })
    .use(router)
    .mount('#app')
