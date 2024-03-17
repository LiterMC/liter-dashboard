export interface APIErrorI {
	type: string
	message: string | undefined
}

export class APIError extends Error {
	readonly type: string
	readonly msg: string | undefined
	constructor(type: string, msg: string | undefined) {
		super(`APIError: ${type}: ${msg}`)
		this.type = type
		this.msg = msg
	}
}

export class AuthError extends APIError {
	constructor(msg: string | undefined) {
		super('AuthError', msg)
	}
}

export interface API {
	readonly logged: boolean

	getAuthToken(): string | null
	verify(): Promise<boolean>
	login(username: string, password: string): Promise<void>
	logout(): Promise<void>

	changePassword(oldPassword: string, newPassword: string): Promise<void>

	getConfig(): Promise<Config>
	setConfig(key: string, value: any): Promise<void>

	getConnections(): Promise<Connection[]>

	getWhitelist(): Promise<Whitelist>
	addWhitelistPlayer(player: string): Promise<void>
	removeWhitelistPlayer(index: number): Promise<void>
	addWhitelistIP(ip: string): Promise<void>
	removeWhitelistIP(index: number): Promise<void>

	getBlacklist(): Promise<Blacklist>
	addBlacklistPlayer(player: string): Promise<void>
	removeBlacklistPlayer(index: number): Promise<void>
	addBlacklistIP(ip: string): Promise<void>
	removeBlacklistIP(index: number): Promise<void>
}

export interface Config {
	onlineMode: boolean
	enableWhitelist: boolean
	enableIPWhitelist: boolean
}

export interface PlayerInfo {
	readonly name: string
	readonly id: string
	readonly isOffline: boolean
}

export interface Whitelist {
	readonly players: PlayerInfo[]
	readonly ips: string[]
}

export interface Blacklist {
	readonly players: PlayerInfo[]
	readonly ips: string[]
}

export interface Connection {
	readonly id: number
	readonly addr: string
	readonly when: Date
	readonly player: PlayerInfo | null
}
