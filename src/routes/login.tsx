import { useState } from 'react';
import { Form, useActionData, useSearchParams } from '@remix-run/react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { createUserSession, verifyLogin, getUserId } from '../utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect('/');
  }
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password');
  const redirectTo = formData.get('redirectTo') as string || '/';

  if (typeof username !== 'string' || typeof password !== 'string') {
    return json({ error: '请输入用户名和密码' }, { status: 400 });
  }

  if (!username || !password) {
    return json({ error: '用户名和密码不能为空' }, { status: 400 });
  }

  const user = await verifyLogin(username, password);
  if (!user) {
    return json({ error: '用户名或密码错误' }, { status: 401 });
  }

  return createUserSession(user.id, redirectTo);
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const testAccounts = [
    { username: 'hall01', name: '张经理', role: '大堂经理' },
    { username: 'account01', name: '李经理', role: '客户经理' },
    { username: 'supervisor01', name: '王主管', role: '运营主管' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">银行网点柜面业务系统</h1>
          <p className="text-slate-500 mt-2">登录后查看业务处理状态</p>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-800">账号登录</h2>
          </div>
          <div className="card-body">
            <Form method="post" className="space-y-4">
              <input
                type="hidden"
                name="redirectTo"
                value={searchParams.get('redirectTo') || '/'}
              />

              {actionData?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {actionData.error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="label">用户名</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="请输入用户名"
                  className="input"
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">密码</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    className="input pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-2.5">
                登录
              </button>
            </Form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-3">测试账号（密码：123456）：</p>
              <div className="space-y-2">
                {testAccounts.map((account) => (
                  <div key={account.username} className="flex items-center justify-between text-sm bg-slate-50 px-3 py-2 rounded-lg">
                    <div>
                      <span className="font-medium text-slate-700">{account.username}</span>
                      <span className="text-slate-500 ml-2">{account.name}</span>
                    </div>
                    <span className="badge bg-blue-100 text-blue-700">{account.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
