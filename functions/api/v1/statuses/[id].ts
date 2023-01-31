// https://docs.joinmastodon.org/methods/statuses/#get

import { cors } from 'wildebeest/backend/src/utils/cors'
import type { Person } from 'wildebeest/backend/src/activitypub/actors'
import type { UUID } from 'wildebeest/backend/src/types'
import type { ContextData } from 'wildebeest/backend/src/types/context'
import { getMastodonStatusById } from 'wildebeest/backend/src/mastodon/status'
import type { Env } from 'wildebeest/backend/src/types/env'
import * as errors from 'wildebeest/backend/src/errors'
import { getObjectByMastodonId } from 'wildebeest/backend/src/activitypub/objects'
import { urlToHandle } from 'wildebeest/backend/src/utils/handle'

export const onRequestGet: PagesFunction<Env, any, ContextData> = async ({ params, env, request }) => {
	const domain = new URL(request.url).hostname
	return handleRequestGet(env.DATABASE, params.id as UUID, domain)
}

export const onRequestDelete: PagesFunction<Env, any, ContextData> = async ({ params, env, request, data }) => {
	const domain = new URL(request.url).hostname
	return handleRequestDelete(env.DATABASE, params.id as UUID, data.connectedActor, domain)
}

export async function handleRequestGet(db: D1Database, id: UUID, domain: string): Promise<Response> {
	const status = await getMastodonStatusById(db, id, domain)
	if (status === null) {
		return new Response('', { status: 404 })
	}

	const headers = {
		...cors(),
		'content-type': 'application/json; charset=utf-8',
	}
	return new Response(JSON.stringify(status), { headers })
}

export async function handleRequestDelete(
	db: D1Database,
	id: UUID,
	connectedActor: Person,
	domain: string
): Promise<Response> {
	const status = await getMastodonStatusById(db, id, domain)
	if (status === null) {
		return errors.statusNotFound(id)
	}
	if (status.account.id !== urlToHandle(connectedActor.id)) {
		return errors.statusNotFound(id)
	}

	const headers = {
		...cors(),
		'content-type': 'application/json; charset=utf-8',
	}
	return new Response(JSON.stringify(status), { headers })
}
