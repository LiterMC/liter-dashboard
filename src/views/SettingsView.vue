<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { sha256 } from 'js-sha256'
import { APIError, type API } from '@/api'

const router = useRouter()

const token = inject('token') as Ref<string | null>
const api = inject('api') as API

async function changepasswd(event: Event): Promise<void> {
	const target = event.target as HTMLFormElement
	const oldpasswd = target['oldpasswd'].value
	const newpasswd = target['newpasswd'].value
	const passwdConfirm = target['newpasswd-confirm'].value
	if (!oldpasswd) {
		alert('Please input the old password')
		return
	}
	if (!newpasswd) {
		alert('Please input the new password')
		return
	}
	if (newpasswd !== passwdConfirm) {
		alert('password not match')
		return
	}
	try {
		await api.changePassword(oldpasswd, newpasswd).then(api.logout)
	} catch (err) {
		alert(String(err))
		return
	}
	alert('Password changed success, please login again')
	router.push({ name: 'login' })
}
</script>

<template>
	<div class="settings">
		<form class="changepasswd" @submit.prevent="changepasswd">
			<fieldset>
				<legend>
					<h3>Change Password</h3>
				</legend>
				<input type="text" name="username" autocomplete="username" style="display: none" />
				<div>
					<label for="settings-changepasswd-old-password">
						<b>Old password</b>
					</label>
					<input
						type="password"
						id="settings-changepasswd-old-password"
						name="oldpasswd"
						autocomplete="password"
						placeholder="Old password"
					/>
				</div>
				<div>
					<label for="settings-changepasswd-new-password">
						<b>New password</b>
					</label>
					<input
						type="password"
						id="settings-changepasswd-new-password"
						name="newpasswd"
						autocomplete="new-password"
						placeholder="New password"
					/>
				</div>
				<div>
					<label for="settings-changepasswd-new-password-confirm">
						<b>Confirm New password</b>
					</label>
					<input
						type="password"
						id="settings-changepasswd-new-password-confirm"
						name="newpasswd-confirm"
						autocomplete="new-password"
						placeholder="Confirm new password"
					/>
				</div>
				<div>
					<button type="submit">Submit</button>
				</div>
			</fieldset>
		</form>
	</div>
</template>

<style scoped>
form > fieldset > div {
	margin-top: 0.3rem;
}

form > fieldset > div > input {
	height: 2rem;
	padding: 0.5rem;
	margin-left: 0.5rem;
	border-radius: 1rem;
}

.changepasswd label {
	display: inline-block;
	width: 11rem;
}
</style>
