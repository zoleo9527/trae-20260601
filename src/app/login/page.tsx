'use client';

import { useState } from 'react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">家电售后管理系统</h1>
          <p className="text-gray-500 mt-2">报修受理与上门预约</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                name="username"
                className="input"
                placeholder="请输入用户名"
                required
                defaultValue="kefu01"
              />
            </div>

            <div>
              <label className="label">密码</label>
              <input
                type="password"
                name="password"
                className="input"
                placeholder="请输入密码"
                required
                defaultValue="123456"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              登录
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">演示账号：</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-gray-600">客服</span>
                <span className="font-mono text-gray-800">kefu01 / 123456</span>
              </div>
              <div className="flex justify-between bg-green-50 px-3 py-2 rounded-lg">
                <span className="text-gray-600">维修工程师</span>
                <span className="font-mono text-gray-800">weixiu01 / 123456</span>
              </div>
              <div className="flex justify-between bg-orange-50 px-3 py-2 rounded-lg">
                <span className="text-gray-600">配件管理员</span>
                <span className="font-mono text-gray-800">peijian01 / 123456</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
