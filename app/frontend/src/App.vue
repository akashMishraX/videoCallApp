<template>
  <RouterView />
</template>

<script lang="ts">
// import { RouterView } from 'vue-router' 
import { createRouter ,createWebHistory } from 'vue-router'

import roomComponent from './components/roomComponent.vue';
import HomeComponent from './components/HomeComponent.vue';
import Login from './components/Login.vue';
const routes = [
      {path : '/', component: HomeComponent,
        beforeEnter: (_to:any, _from:any, next:any) => {
          if (sessionStorage.getItem('isLogged') === 'true') {
            next()
          } else {
            next('/login')
          }
        }
      },
      {path : '/chat/:roomId', component: roomComponent, props: true,
      beforeEnter: (_to:any, _from:any, next:any) => {
          if (sessionStorage.getItem('isLogged') === 'true') {
            next()
          } else {
            next('/login')
          }
        }
      },
      {path : '/login', component: Login},
]
const router = createRouter({
  history: createWebHistory(),
  routes,  // Shortened version, same as `routes: routes`

});


export default router
</script>

<style scoped></style>