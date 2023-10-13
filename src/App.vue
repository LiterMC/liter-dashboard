<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { V1 } from './api/v1'

const token = inject('token') as Ref<string | null>
const api = inject('api') as V1

async function logout() {
	await api.logout()
	token.value = ''
}
</script>

<template>
	<header class="header">
		<nav>
			<RouterLink to="/">Home</RouterLink>
			<template v-if="api.logged">
				| <RouterLink to="/settings">Settings</RouterLink> |
				<RouterLink to="/login" @click="logout()">Logout</RouterLink>
			</template>
			<template v-else> | <RouterLink to="/login">Login</RouterLink> </template>
		</nav>
		<hr />
	</header>

	<div id="body">
		<RouterView v-slot="{ Component }">
			<!-- https://vuejs.org/guide/built-ins/suspense.html#combining-with-other-components -->
			<template v-if="Component">
				<Suspense>
					<component :is="Component"> </component>
					<template #fallback> Page Loading... </template>
				</Suspense>
			</template>
		</RouterView>
	</div>
</template>

<style scoped>
.header {
	margin-bottom: 1rem;
}
</style>
