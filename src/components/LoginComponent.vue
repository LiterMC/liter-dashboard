<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { sha256 } from 'js-sha256'
import { type APIResultBase, type APIErrorI } from '@/api/v1'

const emit = defineEmits<{
	logged: [token: string]
}>()

const router = useRouter()

const username = ref('')
const password = ref('')

const token = inject('token') as Ref<string>

async function login() {
	const res = await axios
		.post<APIResultBase>(`/api/v1/login`, {
			username: username.value,
			password: sha256(password.value)
		})
		.catch((err) => {
			const data = err.response.data
			if (data && data.status) {
				alert(`LoginError: ${data.type}: ${data.message}`)
				return null
			}
			throw err
		})
	if (!res) {
		return
	}
	const data = res.data
	if (data.status !== 'ok') {
		const err = data as APIErrorI
		alert(`LoginError: ${err.type}: ${err.message}`)
		return
	}
	const { token: tk } = data as APIResultBase & { token: string }
	token.value = tk
	emit('logged', tk)
}
</script>

<template>
	<div class="login">
		<form @submit.prevent="login">
			<div>
				<input type="text" name="username" autocomplete="username" v-model="username" />
			</div>
			<div>
				<input type="password" name="password" autocomplete="password" v-model="password" />
			</div>
			<div>
				<input type="submit" value="Login" />
			</div>
		</form>
	</div>
</template>

<style scoped></style>
