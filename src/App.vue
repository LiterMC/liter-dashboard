<script setup lang="ts">
import { provide, ref, watch, type Ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const API_TOKEN_STORAGE_KEY = '__api_tk'

const token: Ref<string | null> = ref(localStorage.getItem(API_TOKEN_STORAGE_KEY))
provide('token', token)
watch(token, (value) => {
  if(value){
    localStorage.setItem(API_TOKEN_STORAGE_KEY, value)
  }else{
    localStorage.removeItem(API_TOKEN_STORAGE_KEY)
  }
})

</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink> | 
      <RouterLink to="/login">Login</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>

</style>
