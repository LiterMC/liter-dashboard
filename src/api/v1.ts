import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

const V1_BASE = new URL('/api/v1', window.location.origin)

export interface APIResultBase {
	status: string
}

export interface APIErrorI extends APIResultBase {
	type: string
	message: string | undefined
}

export class APIError extends Error {
	readonly status: string
	readonly type: string
	readonly msg: string | undefined
	constructor(status: string, type: string, msg: string | undefined) {
		super(`APIError: ${type}: ${msg}`)
		this.status = status
		this.type = type
		this.msg = msg
	}
}

interface PlayerInfoI {
	name: string
	id: string
}

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

export class PlayerInfo {
	readonly _name: string
	readonly _id: string

	constructor(player: PlayerInfoI) {
		this._name = player.name
		this._id = player.id
	}

	get name(): string {
		return this._name
	}

	get id(): string {
		return this._id
	}

	get isOffline(): boolean {
		return this._id === ZERO_UUID
	}
}

interface ConfigI {
	onlineMode: boolean
	enableWhitelist: boolean
	enableIPWhitelist: boolean
}

interface WhitelistI {
	players: PlayerInfoI[]
	ips: string[]
}

interface BlacklistI {
	players: PlayerInfoI[]
	ips: string[]
}

export class Config {
	private readonly api: V1
	private res: AxiosResponse
	private _onlineMode: boolean
	private _enableWhitelist: boolean
	private _enableIPWhitelist: boolean
	constructor(api: V1, res: AxiosResponse, data: ConfigI) {
		this.api = api
		this.res = res
		this._onlineMode = data.onlineMode
		this._enableWhitelist = data.enableWhitelist
		this._enableIPWhitelist = data.enableIPWhitelist
	}

	private setData(data: ConfigI) {
		this._onlineMode = data.onlineMode
		this._enableWhitelist = data.enableWhitelist
		this._enableIPWhitelist = data.enableIPWhitelist
	}

	get onlineMode(): boolean {
		return this._onlineMode
	}

	set onlineMode(v: boolean) {
		this.set('onlineMode', v)
	}

	get enableWhitelist(): boolean {
		return this._enableWhitelist
	}

	set enableWhitelist(v: boolean) {
		this.set('enableWhitelist', v)
	}

	get enableIPWhitelist(): boolean {
		return this._enableIPWhitelist
	}

	set enableIPWhitelist(v: boolean) {
		this.set('enableIPWhitelist', v)
	}

	async refresh(): Promise<void> {
		const res = await this.api.get<ConfigI>('/config')
		this.res = res
		this.setData(res.data)
	}

	async set(key: string, value: any): Promise<void> {
		await this.api.post(
			'/config',
			{
				op: key,
				value: value
			},
			{
				headers: {
					'If-Match': this.res.headers['etag'] as string
				}
			}
		)
	}
}

export class Whitelist {
	private readonly api: V1
	private res: AxiosResponse
	private _players: PlayerInfo[]
	private _ips: string[]
	constructor(api: V1, res: AxiosResponse, data: WhitelistI) {
		this.api = api
		this.res = res
		this._players = data.players.map((p) => new PlayerInfo(p))
		this._ips = data.ips
	}

	private setData(data: WhitelistI) {
		this._players = data.players.map((p) => new PlayerInfo(p))
		this._ips = data.ips
	}

	get players(): PlayerInfo[] {
		return this._players
	}

	get ips(): string[] {
		return this._ips
	}

	async refresh(): Promise<void> {
		const res = await this.api.get<{
			data: WhitelistI
		}>('/whitelist')
		this.res = res
		this.setData(res.data.data)
	}

	async addPlayer(player: string): Promise<void> {
		await this.api.post(
			'/whitelist',
			{
				op: 'addpl',
				value: player
			},
			{
				headers: {
					'If-Match': this.res.headers['etag'] as string
				}
			}
		)
	}

	async removePlayer(index: number): Promise<void> {
		await this.api.post(
			'/whitelist',
			{
				op: 'rmpl',
				index: index
			},
			{
				headers: {
					'If-Match': this.res.headers['etag'] as string
				}
			}
		)
	}
}

export class Blacklist {
	private readonly api: V1
	private res: AxiosResponse
	private _players: PlayerInfo[]
	private _ips: string[]
	constructor(api: V1, res: AxiosResponse, data: BlacklistI) {
		this.api = api
		this.res = res
		this._players = data.players.map((p) => new PlayerInfo(p))
		this._ips = data.ips
	}

	private setData(data: BlacklistI) {
		this._players = data.players.map((p) => new PlayerInfo(p))
		this._ips = data.ips
	}

	get players(): PlayerInfo[] {
		return this._players
	}

	get ips(): string[] {
		return this._ips
	}

	async refresh(): Promise<void> {
		const res = await this.api.get<{
			data: BlacklistI
		}>('/blacklist')
		this.res = res
		this.setData(res.data.data)
	}

	async addPlayer(player: string): Promise<void> {
		await this.api.post(
			'/blacklist',
			{
				op: 'addpl',
				value: player
			},
			{
				headers: {
					'If-Match': this.res.headers['etag'] as string
				}
			}
		)
	}

	async removePlayer(index: number): Promise<void> {
		await this.api.post(
			'/blacklist',
			{
				op: 'rmpl',
				index: index
			},
			{
				headers: {
					'If-Match': this.res.headers['etag'] as string
				}
			}
		)
	}
}

export class V1 {
	private token: string
	protected readonly axios: AxiosInstance
	constructor(token: string) {
		this.token = token
		this.axios = axios.create({
			baseURL: V1_BASE.toString(),
			timeout: 10000,
			headers: {
				'X-Token': this.token
			}
		})
	}

	get logged(): boolean {
		return !!this.token
	}

	setToken(v: string) {
		this.token = v
		this.axios.defaults.headers['X-Token'] = v
	}

	async get<T>(
		path: string,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T & APIResultBase>> {
		const res = await this.axios.get<APIResultBase>(path, config).catch((error) => {
			const data = error.response.data
			if (data && data.status) {
				const err = data as APIErrorI
				throw new APIError(err.status, err.type, err.message)
			}
			throw error
		})
		const data = res.data
		if (res.status !== 200) {
			if (data && data.status) {
				const err = data as APIErrorI
				throw new APIError(err.status, err.type, err.message)
			}
			throw res
		}
		if (data.status === 'ok') {
			return res as AxiosResponse<T & APIResultBase>
		}
		const err = data as APIErrorI
		throw new APIError(err.status, err.type, err.message)
	}

	async post<T>(
		path: string,
		body?: any,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T & APIResultBase>> {
		const res = await this.axios.post<APIResultBase>(path, body, config).catch((error) => {
			const data = error.response.data
			if (data && data.status) {
				const err = data as APIErrorI
				throw new APIError(err.status, err.type, err.message)
			}
			throw error
		})
		if (res.status !== 200) {
			throw res
		}
		const data = res.data
		if (data.status === 'ok') {
			return res as AxiosResponse<T & APIResultBase>
		}
		const err = data as APIErrorI
		throw new APIError(err.status, err.type, err.message)
	}

	async verify(): Promise<boolean> {
		if (!this.token) {
			return false
		}
		try {
			await this.get('/verify')
			return true
		} catch (e) {
			if (e instanceof APIError) {
				return false
			}
			throw e
		}
	}

	async logout(): Promise<void> {
		await this.post('/logout').catch((err) => {
			// we don't care if logout success or not
			console.error('Logout failed:', err)
		})
		this.setToken('')
	}

	async getConfig(): Promise<Config> {
		const res = await this.get<ConfigI>('/config')
		return new Config(this, res, res.data)
	}

	async getWhitelist(): Promise<Whitelist> {
		const res = await this.get<{
			data: WhitelistI
		}>('/whitelist')
		return new Whitelist(this, res, res.data.data)
	}

	async getBlacklist(): Promise<Blacklist> {
		const res = await this.get<{
			data: BlacklistI
		}>('/blacklist')
		return new Blacklist(this, res, res.data.data)
	}
}
