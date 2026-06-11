import type { LoaderFunction, ActionFunction } from '@remix-run/node'
import { destroyUserSession } from '~/lib/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  return destroyUserSession(request)
}

export const action: ActionFunction = async ({ request }) => {
  return destroyUserSession(request)
}

export default function Logout() {
  return null
}
