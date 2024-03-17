<script setup lang="ts">
import { inject, ref, onMounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRequest } from 'vue-request'
import {
	AuthError,
	type API,
	type Config,
	type Whitelist,
	type Blacklist,
	type Connection,
} from '@/api'
import RefreshIcon from '@/icons/RefreshIcon.vue'
import LoginComponent from '@/components/LoginComponent.vue'
import PlayerItem from '@/components/PlayerItem.vue'

const router = useRouter()

const api = inject('api') as API
const onlogged: Ref<(() => void) | null> = ref(null)

const ready = ref(false)
const pending = ref(true)
const whitelist: Ref<Whitelist | null> = ref(null)
const blacklist: Ref<Blacklist | null> = ref(null)
const config: Ref<Config | null> = ref(null)
const { data: connections, error: connPollError } = (() => {
	const pollInterval = 3000 // 3s
	const maxRetryInterval = 3 * 60 * 1000 // 3min
	const pollingInterval = ref(pollInterval)
	return useRequest(
		() =>
			api.getConnections().catch((e) => {
				if (e instanceof AuthError) {
					ready.value = false
					login().then(() => {
						ready.value = true
					})
				}
				throw e
			}),
		{
			ready: ready,
			pollingInterval: pollingInterval,
			onSuccess() {
				pollingInterval.value = pollInterval
			},
			onError() {
				pollingInterval.value = Math.min(pollingInterval.value * 2, maxRetryInterval)
			},
		},
	)
})()

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
		await api.addWhitelistPlayer(player)
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
		await api.addBlacklistPlayer(player)
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
			api.getConfig().then((v) => {
				config.value = v
			}),
			api.getWhitelist().then((v) => {
				whitelist.value = v
			}),
			api.getBlacklist().then((v) => {
				blacklist.value = v
			}),
		])
	} catch (err) {
		alert(err)
	} finally {
		pending.value = false
	}
}

var loginPromise: Promise<void> | null = null

function login(): Promise<void> {
	if (loginPromise) {
		return loginPromise
	}
	return (loginPromise = new Promise<void>((resolve) => {
		onlogged.value = () => {
			onlogged.value = null
			loginPromise = null
			resolve()
		}
	}))
}

async function verifyOrLogin(): Promise<void> {
	if (!(await api.verify())) {
		await login()
	}
	ready.value = true
	try {
		await Promise.all([
			api.getConfig().then((v) => {
				config.value = v
			}),
			api.getWhitelist().then((v) => {
				whitelist.value = v
			}),
			api.getBlacklist().then((v) => {
				blacklist.value = v
			}),
		])
	} finally {
		pending.value = false
	}
}

function formatDate(date: Date): string {
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const day = date.getDate().toString().padStart(2, '0')
	const hour = date.getHours().toString().padStart(2, '0')
	const minute = date.getMinutes().toString().padStart(2, '0')
	const second = date.getSeconds().toString().padStart(2, '0')
	return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}:${second}`
}

onMounted(async () => {
	verifyOrLogin()
})
</script>

<template>
	<main>
		<h1>
			Dashboard
			<RefreshIcon
				class="refresh-btn"
				:spin="pending"
				:disabled="pending"
				@click="!pending && pend() && refresh()"
			/>
		</h1>
		<fieldset class="config config-box">
			<legend class="config-box-title">
				<h3>Config</h3>
			</legend>
			<div v-if="config">
				<div>
					<label>Online Mode:&nbsp;</label>
					<input
						type="checkbox"
						:disabled="pending"
						:checked="config.onlineMode"
						@click.prevent="
							(event) =>
								pend() &&
								api.setConfig('onlineMode', !config?.onlineMode).catch(alert).then(refresh)
						"
					/>
				</div>
				<div>
					<label>Enable Whitelist:&nbsp;</label>
					<input
						type="checkbox"
						:disabled="pending"
						:checked="config.enableWhitelist"
						@click.prevent="
							(event) =>
								pend() &&
								api
									.setConfig('enableWhitelist', !config?.enableWhitelist)
									.catch(alert)
									.then(refresh)
						"
					/>
				</div>
				<div>
					<label>Enable IPWhitelist:&nbsp;</label>
					<input
						type="checkbox"
						:disabled="pending"
						:checked="config.enableIPWhitelist"
						@click.prevent="
							(event) =>
								pend() &&
								api
									.setConfig('enableIPWhitelist', !config?.enableIPWhitelist)
									.catch(alert)
									.then(refresh)
						"
					/>
				</div>
			</div>
			<div v-else>Loading...</div>
		</fieldset>
		<fieldset class="connections config-box">
			<legend class="config-box-title">
				<h3>Connections</h3>
			</legend>
			<div v-if="connPollError" class="error">{{ connPollError }}</div>
			<fieldset v-else-if="connections" class="sub-config-box">
				<legend>
					<span style="font-size: 0.8rem"> count = {{ connections.length }} </span>
				</legend>
				<div class="connection-list">
					<div v-for="conn in connections" :key="conn.id">
						<hr />
						<div>
							<b>ID:</b>
							{{ conn.id }}
							&nbsp;(<i>{{ conn.addr }}</i
							>)
						</div>
						<div><b>When:&nbsp;</b> {{ formatDate(conn.when) }}</div>
						<PlayerItem v-if="conn.player" :name="conn.player.name" :id="conn.player.id" />
					</div>
				</div>
			</fieldset>
			<div v-else>
				<i><b>Loading...</b></i>
			</div>
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
							<button @click="pend() && api.removeWhitelistPlayer(i).catch(alert).then(refresh)">
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
							<button type="submit" class="submit-player">ADD</button>
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
							<button @click="pend() && api.removeBlacklistPlayer(i).catch(alert).then(refresh)">
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
							<button type="submit" class="submit-player">ADD</button>
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
	width: 41rem;
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

.error {
	padding: 1rem;
	border-radius: 1rem;
	border: 0.25rem solid #ff0000;
	color: #ca0000;
	font-weight: 800;
	background-color: #ffd8e0;
}

.sub-config-box {
	padding-right: 0;
	border: none;
	border-top: 0.1rem solid #000a;
	background: inherit;
}

.refresh-btn {
	width: 1.5rem;
	height: 1.5rem;
	color: #6a727f;
	user-select: none;
	cursor: pointer;
}

.refresh-btn:hover {
	color: #000;
}

.connections {
	max-height: 26rem;
	overflow-y: scroll;
}

.player-list {
	display: flex;
	flex-direction: column;
	width: 100%;
}

.form-add-player {
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-top: 0.5rem;
}

.form-add-player * {
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

.submit-player {
	margin-left: 1rem;
	height: 2rem;
	width: 7rem;
	background: #77fb43;
	cursor: pointer;
	font-size: 1rem;
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

@media (max-width: 45rem) {
	.config-box {
		max-width: calc(100% - 1rem);
	}
	.input-player {
		height: 2rem;
		width: calc(100% - 8rem);
	}
}
</style>
