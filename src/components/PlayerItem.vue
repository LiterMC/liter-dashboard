<script setup lang="ts">
defineProps<{
	name: String
	id: String
}>()
</script>

<template>
	<div class="player-item">
		<div class="item-left">
			<img class="player-head" :src="`/api/v1/player/${id}/head`" :alt="`Head of ${name}`" />
			<span class="player-name">
				{{ name }}
			</span>
		</div>
		<div class="player-uuid">
			{{ id }}
		</div>
		<div class="item-ext">
			<slot />
		</div>
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

.item-left {
	display: flex;
	flex-direction: row;
	align-items: center;
	height: 100%;
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

@media (max-width: 45rem) {
	.player-item {
		justify-content: space-between;
	}
	.player-uuid {
		display: none;
	}
}
</style>
