<script setup lang="ts">
import { inject } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { V1 } from './api/v1'

const api = inject('api') as V1
</script>

<template>
	<header>
		<nav>
			<RouterLink to="/">Home</RouterLink>
			| <RouterLink to="/login">Login</RouterLink>
			<template v-if="api.logged"> | <RouterLink to="/settings">Settings</RouterLink> </template>
		</nav>
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

<style scoped></style>
