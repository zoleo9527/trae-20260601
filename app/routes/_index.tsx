import type { LoaderFunction } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { requireUser } from '~/lib/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  await requireUser(request)
  return redirect('/dashboard')
}

export default function Index() {
  return null
}
