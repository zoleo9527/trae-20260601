import {
  json,
  type LoaderFunctionArgs,
  type LinksFunction,
} from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import styles from "./tailwind.css?url";
import { getUser } from "~/utils/session.server";
import { Navbar } from "~/components/Navbar";
import { AlertBar } from "~/components/AlertBar";
import type { Role } from "~/utils/constants";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

type LoaderUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
} | null;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  return json({ user: user as LoaderUser });
};

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="min-h-screen">
          {user && <Navbar user={user} />}
          <div className={user ? "pb-12" : ""}>
            {navigation.state === "loading" && (
              <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-50 animate-pulse" />
            )}
            {user && <AlertBar userId={user.id} role={user.role} />}
            <main className={user ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" : ""}>
              <Outlet />
            </main>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
