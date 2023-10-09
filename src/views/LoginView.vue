<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { sha256 } from 'js-sha256'

const router = useRouter()

const username = ref(null)
const password = ref(null)

const token = inject('token') as Ref<string>

async function login() {
  const res = await axios.post(`/api/v1/login`, {
    username: username.value,
    password: sha256(password.value as any)
  })
  if (res.data.status !== 'ok') {
    console.error('Cannot login:', res.data)
    return
  }
  token.value = res.data.token
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="login">
    <form @submit.prevent="login">
      <div>
        <input type="text" name="username" autocomplete="on" v-model="username" />
      </div>
      <div>
        <input type="password" name="password" autocomplete="on" v-model="password" />
      </div>
      <div>
        <input type="submit" value="Login" />
      </div>
    </form>
  </div>
</template>

<style></style>
