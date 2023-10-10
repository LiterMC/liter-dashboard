<script setup lang="ts">
import LoginComponent from '@/components/LoginComponent.vue'
</script>

<template>
  <div>
    <h1>Login</h1>
    <hr />
    <LoginComponent @logged="$router.push({ name: 'home' })" />
  </div>
</template>

<style scoped>
/*	*/
</style>
