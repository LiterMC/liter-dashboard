<script setup lang="ts">
defineProps<{
	name: String
	id: String
}>()
</script>

<template>
	<div class="player-item">
		<img class="player-head" :src="`/api/v1/player/${id}/head`" :alt="`Head of ${name}`" />
		<span class="player-name">
			{{ name }}
		</span>
		<span class="player-uuid">
			{{ id }}
		</span>
		<slot />
	</div>
</template>

<style scoped>
.player-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	height: 2rem;
	font-size: 1rem;
	font-family: monospace;
}

.player-head {
	width: 1.5rem;
	height: 1.5rem;
	image-rendering: pixelated;
	margin: 0 0.4rem;
	user-select: none;
}

.player-name {
	width: 9.8rem;
	padding-right: 0.2rem;
	margin-right: 0.2rem;
	text-wrap: nowrap;
	font-size: 0.8rem;
	font-family: Minecraftia, monospace;
}

.player-uuid {
	width: 22rem;
	text-wrap: nowrap;
}

.player-name,
.player-uuid {
	user-select: all;
}
</style>
