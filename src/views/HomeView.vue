<script setup lang="ts">
import { inject, ref, onBeforeMount, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { V1, Config, Whitelist, Blacklist } from '@/api/v1'

const router = useRouter()

const token = inject('token') as Ref<string | null>
var api: V1 | null = null

const pending = ref(false)
const whitelist: Ref<Whitelist | null> = ref(null)
const blacklist: Ref<Blacklist | null> = ref(null)
const config: Ref<Config | null> = ref(null)

function alert(msg) {
  window.alert(String(msg))
}

async function whitelistAddPlayer(event: Event) {
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

async function blacklistAddPlayer(event: Event) {
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

onBeforeMount(async () => {
  if (!token.value) {
    return router.push({ name: 'login' })
  }
  api = new V1(token.value)
  if (!(await api.verify())) {
    return router.push({ name: 'login' })
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
})
</script>

<template>
  <main>
    <div>
      <button :disabled="pending" @click="pend() && refresh()">Refresh</button>
    </div>
    <div class="config">
      <h3>Config:</h3>
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
      <h3>Whitelist:</h3>
      <div v-if="whitelist">
        <h4>Players: count={{ whitelist.players.length }}</h4>
        <ul>
          <li v-for="(p, i) in whitelist.players" :key="p.id">
            {{ p.name }}
            <span v-if="p.isOffline"><i>(offline player)</i></span>
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
      <h3>Blacklist:</h3>
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
  </main>
</template>
