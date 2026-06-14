import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, Link, Form, useNavigation } from '@remix-run/react';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import clsx from 'clsx';

import stylesheet from './tailwind.css?url';
import { getUser, getRoleName } from './utils/session.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
];

export const meta = () => [
  { title: '银行网点柜面办理与授权复核系统' },
  { name: 'description', content: '银行网点柜面业务办理与授权复核管理系统' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={clsx(isLoading && 'opacity-75 transition-opacity')}>
        {user ? (
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className="text-lg font-semibold text-slate-800">柜面业务系统</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-1 ml-8">
                      <NavLink to="/">仪表盘</NavLink>
                      <NavLink to="/cases">业务列表</NavLink>
                      <NavLink to="/authorization">授权复核</NavLink>
                    </nav>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{user.name}</p>
                      <p className="text-xs text-slate-500">{getRoleName(user.role)}</p>
                    </div>
                    <Form action="/logout" method="post">
                      <button type="submit" className="btn-secondary text-sm">
                        退出
                      </button>
                    </Form>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
              </div>
            </main>
            <footer className="bg-white border-t border-slate-200 py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-slate-500">
                  © 2026 银行网点柜面业务系统
                </p>
              </div>
            </footer>
          </div>
        ) : (
          <Outlet />
        )}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
    >
      {children}
    </Link>
  );
}
