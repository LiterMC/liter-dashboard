<script setup lang="ts">
import { inject, ref, onMounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { V1, Config, Whitelist, Blacklist } from '@/api/v1'
import LoginComponent from '@/components/LoginComponent.vue'
import PlayerItem from '@/components/PlayerItem.vue'

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
		<fieldset class="config config-box">
			<legend class="config-box-title">
				<h3>Config</h3>
			</legend>
			<div v-if="config">
				<div>
					<b>Online Mode:&nbsp;</b>
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
					<b>Enable Whitelist:&nbsp;</b>
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
					<b>Enable IPWhitelist:&nbsp;</b>
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
		</fieldset>
		<fieldset class="whitelist config-box">
			<legend class="config-box-title">
				<h3>Whitelist</h3>
			</legend>
			<template v-if="whitelist">
				<fieldset class="sub-config-box" :disabled="pending">
					<legend>
						<h4 style="display: inline; font-weight: 600">Players</h4>
						<span style="font-size: 0.8rem">
							&nbsp;&nbsp; count = {{ whitelist.players.length }}
						</span>
					</legend>
					<div class="player-list">
						<PlayerItem v-for="(p, i) in whitelist.players" :key="p.id" :name="p.name" :id="p.id">
							<button @click="pend() && whitelist.removePlayer(i).catch(alert).then(refresh)">
								-
							</button>
						</PlayerItem>
						<form class="form-add-player" @submit.prevent="whitelistAddPlayer">
							<input
								type="text"
								name="player"
								class="input-player"
								placeholder="Player name or UUID"
								autocomplete="off"
							/>
							<input type="submit" value="Add" />
						</form>
					</div>
				</fieldset>
			</template>
			<div v-else>
				<i><b>Loading...</b></i>
			</div>
		</fieldset>
		<fieldset class="blacklist config-box">
			<legend class="config-box-title">
				<h3>Blacklist</h3>
			</legend>
			<template v-if="blacklist">
				<fieldset class="sub-config-box" :disabled="pending">
					<legend>
						<h4 style="display: inline; font-weight: 600">Players</h4>
						<span style="font-size: 0.8rem">
							&nbsp;&nbsp; count = {{ blacklist.players.length }}
						</span>
					</legend>
					<div class="player-list">
						<PlayerItem v-for="(p, i) in blacklist.players" :key="p.id" :name="p.name" :id="p.id">
							<button @click="pend() && blacklist.removePlayer(i).catch(alert).then(refresh)">
								-
							</button>
						</PlayerItem>
						<form class="form-add-player" @submit.prevent="blacklistAddPlayer">
							<input
								type="text"
								name="player"
								class="input-player"
								placeholder="Player name or UUID"
								autocomplete="off"
							/>
							<input type="submit" value="Add" />
						</form>
					</div>
				</fieldset>
			</template>
			<div v-else>
				<i><b>Loading...</b></i>
			</div>
		</fieldset>
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
.config-box {
	margin: 1rem 0;
	padding: 1rem;
	border-right: none;
	border-bottom: none;
	border-radius: 0.5rem;
	box-shadow: 0 0 1rem #0004;
	background: #eee;
}

.config-box-title > h3 {
	font-size: 1.2rem;
	font-weight: 700;
	font-family: Minecraftia, monospace;
}

.config {
	font-family: Minecraftia, monospace;
}

.config,
.whitelist,
.blacklist {
	width: 41rem;
}

.sub-config-box {
	padding-right: 0;
	border: none;
	border-top: 0.1rem solid #000a;
	background: inherit;
}

.player-list {
	display: flex;
	flex-direction: column;
	width: 100%;
}

.form-add-player {
	margin-top: 0.5rem;
}

.form-add-player input {
	font-size: 0.8rem;
	font-weight: 600;
	font-family: Minecraftia, monospace;
}

.input-player {
	height: 2rem;
	width: 29.5rem;
	padding: 0 0.5rem 0 2.2rem;
	border: none;
	border-bottom: 0.1rem solid #777;
}

.input-player:focus {
	outline: none;
}

.form-add-player > input[type='submit'] {
	margin-left: 1rem;
	height: 2rem;
	width: 7rem;
	background: #77fb43;
	cursor: pointer;
}

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
