import type { LoaderFunction, ActionFunction } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { Form, useActionData, useNavigation } from '@remix-run/react'
import { Lock, User } from 'lucide-react'
import { getUserSession, createUserSession } from '~/lib/session.server'
import { authenticateUser } from '~/lib/auth.server'

interface ActionData {
  error?: string
  username?: string
}

export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await getUserSession(request)
  if (user) {
    return redirect('/dashboard')
  }
  return null
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: '请输入用户名和密码', username }
  }

  const user = await authenticateUser(username, password)
  if (!user) {
    return { error: '用户名或密码错误', username }
  }

  return createUserSession(user, '/dashboard')
}

export default function Login() {
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className="min-h-screen flex items-center justify-center bg-park-bg">
      <div className="w-full max-w-md">
        <div className="bg-park-card rounded-lg border border-park-border p-8">
          <h1 className="text-2xl font-semibold text-center text-park-text mb-2">智慧停车场投诉申诉系统</h1>
          <p className="text-sm text-park-muted text-center mb-8">三种角色均可使用同一密码登录</p>

          <Form method="post" className="space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-park-muted" />
                <input
                  type="text"
                  name="username"
                  defaultValue={actionData?.username || ''}
                  placeholder="用户名"
                  className="w-full bg-park-bg border border-park-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber transition-colors"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-park-muted" />
                <input
                  type="password"
                  name="password"
                  placeholder="密码"
                  className="w-full bg-park-bg border border-park-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber transition-colors"
                />
              </div>
            </div>

            {actionData?.error && (
              <div className="text-red-400 text-sm text-center">{actionData.error}</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {isSubmitting ? '登录中...' : '登 录'}
            </button>
          </Form>

          <div className="mt-6 pt-6 border-t border-park-border">
            <p className="text-xs text-park-muted mb-3">演示账号：</p>
            <div className="space-y-2 text-xs text-park-muted">
              <div className="flex justify-between">
                <span>运营专员</span>
                <span className="text-park-text">cs001 / 123456</span>
              </div>
              <div className="flex justify-between">
                <span>客服</span>
                <span className="text-park-text">cs002 / 123456</span>
              </div>
              <div className="flex justify-between">
                <span>设备维护员</span>
                <span className="text-park-text">cs003 / 123456</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
