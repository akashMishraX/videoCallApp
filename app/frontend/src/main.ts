import { createApp } from 'vue'; // Correct import for Vue 3

import './style.css'
import App from './App.vue';
import router from './App.vue';
import vue3GoogleLogin from 'vue3-google-login'

const CLIENT_ID = '450778450167-jmfjl7uiriclrh6dcq48edktab7js0ov.apps.googleusercontent.com'

createApp(App)
    .use(vue3GoogleLogin,{
        clientId:CLIENT_ID
    })
    .use(router)
    .mount('#app')
