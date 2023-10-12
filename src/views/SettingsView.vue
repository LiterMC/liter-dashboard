<script setup lang="ts">
import { inject, type Ref } from 'vue'
import axios from 'axios'
import { sha256 } from 'js-sha256'

const token = inject('token') as Ref<string | null>
import { V1, type APIResultBase, type APIErrorI } from '@/api/v1'

async function changepasswd(event: Event): Promise<void> {
	const target = event.target as HTMLFormElement
	const oldpasswd = target.oldpasswd.value
	const newpasswd = target.newpasswd.value
	const res = await axios
		.post<APIResultBase>(`/api/v1/login`, {
			oldPassword: sha256(oldpasswd),
			newPassword: sha256(newpasswd)
		}, {
      headers: {
        'X-Token': token.value
      }
    })
		.catch((err) => {
			const data = err.response.data
			if (data && data.status) {
				alert(`LoginError: ${data.type}: ${data.message}`)
				return null
			}
			throw err
		})
	if (!res) {
		return
	}
	const data = res.data
	if (data.status !== 'ok') {
		const err = data as APIErrorI
		alert(`Error: ${err.type}: ${err.message}`)
		return
	}
}
</script>

<template>
	<div class="settings">
		<form class="changepasswd" @submit.prevent="changepasswd">
			<label for="settings-changepasswd-old-password">
				<b>Old password:</b>
			</label>
			<input
				type="password"
				id="settings-changepasswd-old-password"
				name="password"
				autocomplete="password"
			/>
			<label for="settings-changepasswd-new-password">
				<b>New password:</b>
			</label>
			<input
				type="password"
				id="settings-changepasswd-new-password"
				name="new-password"
				autocomplete="new-password"
			/>
			<label for="settings-changepasswd-new-password-confirm">
				<b>Confirm New password:</b>
			</label>
			<input
				type="password"
				id="settings-changepasswd-new-password-confirm"
				name="new-password-confirm"
				autocomplete="new-password"
			/>
		</form>
	</div>
</template>

<style scoped>
.settings {
	/*	*/
}
</style>
