<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { sha256 } from 'js-sha256'
import { V1, type APIResultBase, type APIErrorI } from '@/api/v1'

const emit = defineEmits<{
	logged: [token: string]
}>()

const router = useRouter()

const username = ref('')
const password = ref('')

const token = inject('token') as Ref<string>
const api = inject('api') as V1

async function login(): Promise<void> {
	const user = username.value
	const passwd = sha256(password.value)
	if (!user) {
		alert('Please input the username')
		return
	}
	if (!passwd) {
		alert('Please input the password')
		return
	}
	password.value = ''
	const res = await axios
		.post<APIResultBase>(`/api/v1/login`, {
			username: user,
			password: passwd
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
				<label for="username"> Username </label>
				<input
					type="text"
					name="username"
					autocomplete="username"
					placeholder="username"
					v-model="username"
				/>
			</div>
			<div>
				<label for="password"> Password </label>
				<input
					type="password"
					name="password"
					autocomplete="password"
					placeholder="password"
					v-model="password"
				/>
			</div>
			<div>
				<button type="submit">Login</button>
			</div>
		</form>
	</div>
</template>

<style scoped>
form > div {
	margin-top: 0.3rem;
}

form > div > input {
	height: 2rem;
	padding: 0.5rem;
	margin-left: 0.5rem;
	border-radius: 1rem;
}
</style>
