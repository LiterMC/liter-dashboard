import './assets/main.css'

import { createApp, ref, reactive, watch, type Ref } from 'vue'
import App from './App.vue'
import router from './router'
import { V1 } from './api/v1'

const app = createApp(App)

app.use(router)

const API_TOKEN_STORAGE_KEY = '__api_tk'

const token: Ref<string | null> = ref(localStorage.getItem(API_TOKEN_STORAGE_KEY))
const api = reactive(new V1(''))
watch(token, (value) => {
	if (value) {
		api.setToken(value)
		localStorage.setItem(API_TOKEN_STORAGE_KEY, value)
	} else {
		api.setToken('')
		localStorage.removeItem(API_TOKEN_STORAGE_KEY)
	}
})

app.provide('token', token)
app.provide('api', api)

app.mount('#app')
