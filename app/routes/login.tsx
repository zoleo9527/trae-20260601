import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { login, createUserSession, getUserId } from "~/utils/session.server";
import { z } from "zod";
import { Button, Input, Label, Card } from "~/components/ui";

export const meta: MetaFunction = () => {
  return [
    { title: "登录 - 手机维修店管理系统" },
  ];
};

const LoginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "密码不能为空"),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");

  const validated = LoginSchema.safeParse({ email, password });
  if (!validated.success) {
    return json(
      { errors: validated.error.flatten().fieldErrors, ok: false },
      { status: 400 }
    );
  }

  const user = await login(validated.data.email, validated.data.password);
  if (!user) {
    return json({ errors: { password: ["邮箱或密码错误"] }, ok: false }, { status: 401 });
  }

  return createUserSession(user.id, "/");
};

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  useLoaderData<typeof loader>();

  const demoAccounts = [
    { email: "qiantai@repair.com", password: "password123", name: "李小美（前台）", role: "前台" },
    { email: "weixiu@repair.com", password: "password123", name: "张大强（维修师）", role: "维修师" },
    { email: "dianzhang@repair.com", password: "password123", name: "赵经理（店长）", role: "店长" },
  ];

  const fillDemo = (email: string, password: string) => {
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById("password") as HTMLInputElement;
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block">
          <div className="text-5xl mb-6">🔧</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            手机维修店管理系统
          </h1>
          <p className="text-slate-600 mb-6 leading-relaxed">
            从接机到交付全程追踪，检测报价与客户确认责任清晰，一线操作高效流转，异常情况实时预警。
          </p>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>工单状态全程留痕，责任到人无空档</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>检测报价关键判断在客户确认时直接可见</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>异常样例自动触发提醒或退回</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>支持批量处理和历史回看</span>
            </li>
          </ul>
        </div>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">账号登录</h2>
            <p className="text-sm text-slate-500 mt-1">请选择演示账号或输入凭据登录</p>
          </div>

          <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-2">点击快速填入演示账号：</p>
            <div className="grid gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className="flex items-center justify-between px-3 py-2 text-left text-sm bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <span>
                    <span className="font-medium text-slate-800">{acc.name}</span>
                    <span className="ml-2 text-xs text-slate-500">({acc.role})</span>
                  </span>
                  <span className="text-xs text-slate-400">{acc.email}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">所有演示账号密码均为：password123</p>
          </div>

          <Form method="post" className="space-y-4">
            <div>
              <Label htmlFor="email" required>邮箱</Label>
              <Input id="email" name="email" type="email" placeholder="qiantai@repair.com" />
              {actionData?.errors && "email" in actionData.errors && actionData.errors.email && (
                <p className="mt-1 text-xs text-red-600">{actionData.errors.email[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password" required>密码</Label>
              <Input id="password" name="password" type="password" placeholder="password123" />
              {actionData?.errors?.password && (
                <p className="mt-1 text-xs text-red-600">{actionData.errors.password[0]}</p>
              )}
            </div>
            <Button type="submit" className="w-full" size="lg">
              登录
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}
