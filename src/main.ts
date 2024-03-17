import './assets/main.css'
import './assets/minecraft-font.css'

import { createApp, ref, reactive, watch, type Ref } from 'vue'
import vueCookies, { type VueCookies } from 'vue-cookies'
// import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { createDefaultAPI } from './api'
import { useCookies, bindRefToCookie } from './cookies'

// registerSW({
// 	immediate: true,
// })

const app = createApp(App)

app.use(router)
app.use(vueCookies, { expires: '30d', path: '/main' })

const cookies = (app as unknown as { $cookies: VueCookies }).$cookies

const API_TOKEN_STORAGE_KEY = '_authToken'

const token: Ref<string | null> = bindRefToCookie(
	ref(null),
	API_TOKEN_STORAGE_KEY,
	60 * 60 * 12,
	cookies,
)
const api = reactive(createDefaultAPI(token.value))
watch(api.getAuthToken, (t) => {
	token.value = t
})

app.provide('api', api)

app.mount('#app')
