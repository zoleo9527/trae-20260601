import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import Layout from '~/components/Layout';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: cssBundleHref },
  {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.14/dist/tailwind.min.css',
  },
];

export default function App() {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
