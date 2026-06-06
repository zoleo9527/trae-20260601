import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { createUserSession, login, getUserId } from "~/utils/session.server";
import { ROLE_LABELS } from "~/utils/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const redirectTo = formData.get("redirectTo")?.toString() || "/";

  const user = await login(username, password);

  if (!user) {
    return json(
      { errors: { login: "用户名或密码错误" } },
      { status: 400 }
    );
  }

  return createUserSession(user.id, redirectTo);
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const testAccounts = [
    { username: "dorm1", role: "DORM_MANAGER", name: "李阿姨" },
    { username: "counselor1", role: "COUNSELOR", name: "王老师" },
    { username: "maint1", role: "MAINTENANCE", name: "张师傅" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-8">
            <h1 className="text-2xl font-bold text-white text-center">
              学生宿舍管理系统
            </h1>
            <p className="text-primary-100 text-center mt-2">
              卫生检查与整改复查
            </p>
          </div>

          <Form method="post" className="px-8 py-8 space-y-6">
            <input
              type="hidden"
              name="redirectTo"
              value={searchParams.get("redirectTo") ?? undefined}
            />

            {actionData?.errors?.login && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {actionData.errors.login}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                ref={usernameRef}
                type="text"
                name="username"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="请输入用户名"
                defaultValue="dorm1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="请输入密码"
                defaultValue="123456"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-colors"
            >
              登录系统
            </button>
          </Form>

          <div className="px-8 pb-8">
            <p className="text-sm text-gray-500 mb-4 text-center">测试账号（密码均为 123456）：</p>
            <div className="space-y-2">
              {testAccounts.map((acc) => (
                <div
                  key={acc.username}
                  className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-medium text-gray-700">{acc.name}</span>
                    <span className="text-gray-500 ml-2">({acc.username})</span>
                  </div>
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                    {ROLE_LABELS[acc.role]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
