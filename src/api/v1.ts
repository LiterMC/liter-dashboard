import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
	type AxiosError,
} from 'axios'
import { sha256 } from 'js-sha256'
import {
	APIError,
	AuthError,
	type API,
	type Config,
	type PlayerInfo,
	type Whitelist,
	type Blacklist,
	type Connection,
} from './api'

const V1_BASE = new URL('/api/v1', window.location.origin).toString()

export interface APIResultBase {
	status: string
}

export interface APIErrorI {
	type: string
	message: string | undefined
}

function throwAPIError(err: AxiosError<any>): never {
	const res = err.response
	if (res && res.data && res.data.type) {
		const data = res.data as APIErrorI
		if (data.type === 'AuthError') {
			throw new AuthError(data.message)
		}
		throw new APIError(data.type, data.message)
	}
	throw err
}

interface LoginResI {
	token: string
}

interface PlayerInfoI {
	name: string
	id: string
}

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

function createPlayerInfo(player: PlayerInfoI): PlayerInfo {
	return {
		name: player.name,
		id: player.id,
		isOffline: player.id === ZERO_UUID,
	}
}

interface ConnectionI {
	id: number
	addr: string
	when: number
	player?: PlayerInfoI
}

export class V1 implements API {
	private token: string | null
	protected readonly axios: AxiosInstance
	protected readonly etags: Map<string, string>
	constructor(oldToken?: string | null) {
		this.token = null
		this.axios = axios.create({
			baseURL: V1_BASE,
			timeout: 10000,
			headers: {
				// 'X-Token': this.token,
			},
		})
		this.etags = new Map()
		if (oldToken) {
			this.token = oldToken
			this.verify()
				.catch(() => false)
				.then((ok) => {
					if (!ok) {
						this.setToken(null)
					}
				})
		}
	}

	get logged(): boolean {
		return !!this.token
	}

	getAuthToken(): string | null {
		return this.token
	}

	private setToken(v: string | null): void {
		this.token = v
		if (v) {
			this.axios.defaults.headers['X-Token'] = v
		} else {
			delete this.axios.defaults.headers['X-Token']
		}
	}

	async get<T>(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		const res = await this.axios.get<T>(path, config).catch(throwAPIError)
		if (200 <= res.status && res.status < 300) {
			throw res
		}
		const etag = res.headers['etag']
		if (typeof etag === 'string') {
			this.etags.set(path, etag)
		} else {
			this.etags.delete(path)
		}
		return res
	}

	async post<T>(path: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		const etag = this.etags.get(path)
		if (etag) {
			config ||= {}
			config.headers ||= {}
			if (!('If-Match' in config.headers)) {
				config.headers['If-Match'] = etag
			}
		}
		const res = await this.axios.post<T>(path, body, config).catch(throwAPIError)
		if (200 <= res.status && res.status < 300) {
			throw res
		}
		return res
	}

	async verify(): Promise<boolean> {
		if (!this.token) {
			return false
		}
		return this.get('/verify')
			.then(() => true)
			.catch((e) => {
				if (e instanceof AuthError) {
					return false
				}
				throw e
			})
	}

	async login(username: string, password: string): Promise<void> {
		const res = await axios.post<LoginResI>(`/login`, {
			username: username,
			password: sha256(password),
		})
		this.setToken(res.data.token)
	}

	async logout(): Promise<void> {
		await this.post('/logout').catch((err) => {
			// we don't care if logout success or not
			console.error('Logout failed:', err)
		})
		this.setToken(null)
	}

	async changePassword(oldPassword: string, newPassword: string): Promise<void> {
		await this.post(`/changepasswd`, {
			oldPassword: sha256(oldPassword),
			newPassword: sha256(newPassword),
		})
	}

	async getConfig(): Promise<Config> {
		const res = await this.get<Config>('/config')
		return res.data
	}

	async setConfig(key: string, value: any): Promise<void> {
		await this.post('/config', {
			op: key,
			value: value,
		})
	}

	async getWhitelist(): Promise<Whitelist> {
		const res = await this.get<{
			data: Whitelist
		}>('/whitelist')
		return res.data.data
	}

	async getBlacklist(): Promise<Blacklist> {
		const res = await this.get<{
			data: Blacklist
		}>('/blacklist')
		return res.data.data
	}

	async getConnections(): Promise<Connection[]> {
		const res = await this.get<{
			data: ConnectionI[]
		}>('/conns')
		return res.data.data.map((c) => ({
			id: c.id,
			addr: c.addr,
			when: new Date(c.when * 1000),
			player: c.player ? createPlayerInfo(c.player) : null,
		}))
	}

	async addWhitelistPlayer(player: string): Promise<void> {
		await this.post('/whitelist', {
			op: 'addpl',
			value: player,
		})
	}

	async removeWhitelistPlayer(index: number): Promise<void> {
		await this.post('/whitelist', {
			op: 'rmpl',
			index: index,
		})
	}

	async addWhitelistIP(ip: string): Promise<void> {
		throw 'not implemented'
	}

	async removeWhitelistIP(index: number): Promise<void> {
		throw 'not implemented'
	}

	async addBlacklistPlayer(player: string): Promise<void> {
		await this.post('/blacklist', {
			op: 'addpl',
			value: player,
		})
	}

	async removeBlacklistPlayer(index: number): Promise<void> {
		await this.post('/blacklist', {
			op: 'rmpl',
			index: index,
		})
	}

	async addBlacklistIP(ip: string): Promise<void> {
		throw 'not implemented'
	}

	async removeBlacklistIP(index: number): Promise<void> {
		throw 'not implemented'
	}
}
