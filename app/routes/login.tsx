import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import { createUserSession, getUserId, verifyLogin } from "~/utils/session.server";

export const meta: MetaFunction = () => {
  return [{ title: "登录 - 洗浴中心管理系统" }];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo") || "/";

  if (typeof username !== "string" || typeof password !== "string") {
    return json({ error: "无效的表单数据" }, { status: 400 });
  }

  if (!username || !password) {
    return json({ error: "请输入用户名和密码" }, { status: 400 });
  }

  const user = await verifyLogin(username, password);
  if (!user) {
    return json({ error: "用户名或密码错误" }, { status: 400 });
  }

  return createUserSession(user.id, redirectTo as string);
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [selectedDemo, setSelectedDemo] = useState("");

  const demoAccounts = [
    { username: "admin", name: "管理员", desc: "全部权限" },
    { username: "reception", name: "前台小王", desc: "开台登记" },
    { username: "supervisor", name: "楼层主管老李", desc: "现场管理" },
    { username: "finance", name: "财务张姐", desc: "押金核验" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            洗浴中心管理系统
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            手牌开台与押金核验
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form method="post" className="space-y-6">
            <input
              type="hidden"
              name="redirectTo"
              value={searchParams.get("redirectTo") || undefined}
            />
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                用户名
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input"
                  value={selectedDemo}
                  onChange={(e) => setSelectedDemo(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input"
                  defaultValue="123456"
                />
              </div>
            </div>

            {actionData?.error ? (
              <div className="text-red-600 text-sm">{actionData.error}</div>
            ) : null}

            <div>
              <button type="submit" className="btn-primary w-full">
                登录
              </button>
            </div>
          </Form>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">演示账号（点击快速填入）</h3>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => setSelectedDemo(acc.username)}
                  className={`p-2 text-left border rounded-lg text-sm transition-colors ${
                    selectedDemo === acc.username
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">{acc.name}</div>
                  <div className="text-xs text-gray-500">{acc.desc}</div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              所有演示账号密码均为：123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
