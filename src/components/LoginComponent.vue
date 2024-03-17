<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { sha256 } from 'js-sha256'
import { type API, APIError } from '@/api'

const emit = defineEmits<{
	logged: []
}>()

const router = useRouter()

const username = ref('')
const password = ref('')

const api = inject('api') as API

async function login(): Promise<void> {
	const user = username.value
	const passwd = password.value
	if (!user) {
		alert('Please input the username')
		return
	}
	if (!passwd) {
		alert('Please input the password')
		return
	}
	password.value = ''
	try {
		await api.login(user, passwd)
	} catch (err) {
		alert(String(err))
		return
	}
	emit('logged')
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
