import type { API } from './api'
import { V1 } from './v1'

export * from './api'

export function createDefaultAPI(oldToken?: string | null): API {
	return new V1(oldToken)
}
