<script setup lang="ts">
import { inject, ref, onMounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { V1, Config, Whitelist, Blacklist } from '@/api/v1'
import LoginComponent from '@/components/LoginComponent.vue'

const router = useRouter()

const api = inject('api') as V1
const onlogged: Ref<(() => void) | null> = ref(null)

const pending = ref(false)
const whitelist: Ref<Whitelist | null> = ref(null)
const blacklist: Ref<Blacklist | null> = ref(null)
const config: Ref<Config | null> = ref(null)

function alert(msg: any) {
	window.alert(String(msg))
}

async function whitelistAddPlayer(event: Event): Promise<void> {
	if (whitelist.value === null) {
		console.error('whitelist instance is null')
		return
	}
	pend()
	const target = event.target as HTMLFormElement
	const player = target.player.value
	try {
		await whitelist.value.addPlayer(player)
		target.player.value = ''
	} catch (err) {
		alert(err)
	} finally {
		refresh()
	}
}

async function blacklistAddPlayer(event: Event): Promise<void> {
	if (blacklist.value === null) {
		console.error('blacklist instance is null')
		return
	}
	pend()
	const target = event.target as HTMLFormElement
	const player = target.player.value
	try {
		await blacklist.value.addPlayer(player)
		target.player.value = ''
	} catch (err) {
		alert(err)
	} finally {
		refresh()
	}
}

function pend(): boolean {
	if (pending.value) {
		throw 'A request is already in progress'
	}
	pending.value = true
	return true
}

async function refresh(): Promise<void> {
	try {
		await Promise.all([
			config.value?.refresh(),
			whitelist.value?.refresh(),
			blacklist.value?.refresh()
		])
	} catch (err) {
		alert(err)
	} finally {
		pending.value = false
	}
}

async function verifyOrLogin(): Promise<void> {
	if (!(await api.verify())) {
		await new Promise<void>((resolve) => {
			onlogged.value = () => {
				resolve()
				onlogged.value = null
			}
		})
	}
	api.getConfig().then((v) => {
		config.value = v
	})
	api.getWhitelist().then((v) => {
		whitelist.value = v
	})
	api.getBlacklist().then((v) => {
		blacklist.value = v
	})
}

onMounted(async () => {
	verifyOrLogin()
})
</script>

<template>
	<main>
		<h1>Dashboard</h1>
		<div>
			<button :disabled="pending" @click="pend() && refresh()">Refresh</button>
		</div>
		<div class="config">
			<h3><b>Config:</b></h3>
			<div v-if="config">
				<div>
					<b>Online Mode:</b>
					<input
						type="checkbox"
						:disabled="pending"
						:checked="config.onlineMode"
						@click.prevent="
							(event) =>
								pend() && config?.set('onlineMode', !config?.onlineMode).catch(alert).then(refresh)
						"
					/>
				</div>
				<div>
					<b>Enable Whitelist:</b>
					<input
						type="checkbox"
						:disabled="pending"
						:checked="config.enableWhitelist"
						@click.prevent="
							(event) =>
								pend() &&
								config?.set('enableWhitelist', !config?.enableWhitelist).catch(alert).then(refresh)
						"
					/>
				</div>
				<div>
					<b>Enable IPWhitelist:</b>
					<input
						type="checkbox"
						:disabled="pending"
						:checked="config.enableIPWhitelist"
						@click.prevent="
							(event) =>
								pend() &&
								config
									?.set('enableIPWhitelist', !config?.enableIPWhitelist)
									.catch(alert)
									.then(refresh)
						"
					/>
				</div>
			</div>
			<div v-else>Loading...</div>
		</div>
		<div class="whitelist">
			<h3><b>Whitelist:</b></h3>
			<div v-if="whitelist">
				<h4>Players: count={{ whitelist.players.length }}</h4>
				<ul>
					<li v-for="(p, i) in whitelist.players" :key="p.id">
						{{ p.name }}
						<span v-if="p.isOffline">
							<i>(offline player)</i>
						</span>
						<span v-else> ({{ p.id }}) </span>
						<button
							:disabled="pending"
							@click="pend() && whitelist.removePlayer(i).catch(alert).then(refresh)"
						>
							-
						</button>
					</li>
					<li>
						<form @submit.prevent="whitelistAddPlayer">
							<input type="text" name="player" />
							<input type="submit" value="Add" :disabled="pending" />
						</form>
					</li>
				</ul>
			</div>
			<div v-else>
				<i><b>Loading...</b></i>
			</div>
		</div>
		<div class="blacklist">
			<h3><b>Blacklist:</b></h3>
			<div v-if="blacklist">
				<h4>Players: count={{ blacklist.players.length }}</h4>
				<ul>
					<li v-for="(p, i) in blacklist.players" :key="p.id">
						{{ p.name }}
						<span v-if="p.isOffline"><i>(offline player)</i></span>
						<button
							:disabled="pending"
							@click="pend() && blacklist.removePlayer(i).catch(alert).then(refresh)"
						>
							-
						</button>
					</li>
					<li>
						<form @submit.prevent="blacklistAddPlayer">
							<input type="text" name="player" />
							<input type="submit" value="Add" :disabled="pending" />
						</form>
					</li>
				</ul>
			</div>
			<div v-else>
				<i><b>Loading...</b></i>
			</div>
		</div>
		<div v-if="onlogged" class="login-pop">
			<div class="login-box">
				<h3>Token was expired, please login again</h3>
				<hr />
				<LoginComponent @logged="onlogged()" />
			</div>
		</div>
	</main>
</template>

<style scoped>
.login-pop {
	position: fixed;
	width: 100vw;
	height: 100vh;
	top: 0;
	left: 0;
	background: #0008;
}

.login-box {
	position: absolute;
	width: 80%;
	height: 80%;
	top: 10%;
	left: 10%;
	padding: 1rem;
	border-radius: 1rem;
	background: #eee;
	box-shadow: 0 0 2px #000a;
}
</style>
