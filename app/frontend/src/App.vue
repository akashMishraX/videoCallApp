<script setup lang="ts">
  import HelloWorld from './components/HelloWorld.vue'
  import ChatComponent from './components/ChatComponent.vue';
  import { createRouter, createWebHistory } from 'vue-router'; // Correct import for Vue Router 4
</script>


<script lang="ts">
  const routes = [
      {path : '/', component: HelloWorld},
      {path : '/chat', component: ChatComponent},
  ]
  export const router = createRouter({
      history: createWebHistory(),
      routes
  })
</script>

<template>
  <nav >
    <RouterLink to="/">
      <span>Home</span>
    </RouterLink>
    <RouterLink to="/chat">
      <span>chat</span>
    </RouterLink>
  </nav>
   <RouterView />
</template>

<style>
nav{
    display: flex;
    gap: 1rem;
    background-color: rgb(199, 199, 199);

}
span {
  color: black;
  text-decoration: none;
  font-size: 20px;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #ffffff;
  margin-top: 60px;
}
</style>