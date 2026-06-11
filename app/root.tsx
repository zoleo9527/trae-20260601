import type { LinksFunction, MetaFunction } from '@remix-run/node'
import { Links, Meta, Outlet, Scripts, LiveReload } from '@remix-run/react'
import tailwindStyles from './styles/tailwind.css?url'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: tailwindStyles },
]

export const meta: MetaFunction = () => [
  { charset: 'utf-8' },
  { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  { title: '停车场投诉管理系统' },
]

export default function App() {
  return (
    <html lang="zh-CN">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-park-bg text-park-text min-h-screen">
        <Outlet />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
