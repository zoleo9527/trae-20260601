import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <style>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          a.active {
            background-color: #667eea !important;
            color: #fff !important;
          }
          table {
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e9ecef;
            }
            th {
              background-color: #f8f9fa;
              font-weight: 600;
            }
            tr:hover {
              background-color: #f8f9fa;
            }
          }
        `}</style>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
