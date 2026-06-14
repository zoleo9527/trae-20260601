import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import prisma from '~/db.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role') || undefined;

  const users = await prisma.user.findMany({
    where: role ? { role } : {}
  });

  return json({ users });
}