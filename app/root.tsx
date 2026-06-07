import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  Link,
  Form,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import stylesheet from "~/tailwind.css?url";
import { getUser } from "~/utils/session.server";
import { roleLabels } from "~/utils/booking";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);
  return json({ user });
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
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
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-primary-600">
                  洗浴中心管理系统
                </Link>
                <div className="hidden sm:ml-10 sm:flex sm:space-x-4">
                  <Link
                    to="/bookings"
                    className="inline-flex items-center px-3 py-2 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  >
                    开台管理
                  </Link>
                  {user.role === "FINANCE" || user.role === "ADMIN" ? (
                    <Link
                      to="/deposits"
                      className="inline-flex items-center px-3 py-2 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      押金核验
                    </Link>
                  ) : null}
                  <Link
                    to="/exceptions"
                    className="inline-flex items-center px-3 py-2 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  >
                    异常处理
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-500">{roleLabels[user.role]}：</span>
                  <span className="font-medium text-gray-700">{user.name}</span>
                </div>
                <Form action="/logout" method="post">
                  <button
                    type="submit"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    退出登录
                  </button>
                </Form>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className={user ? "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" : ""}>
        <Outlet />
      </main>
    </div>
  );
}
