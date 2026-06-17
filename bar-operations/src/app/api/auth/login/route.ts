import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Demo authentication - in production, use proper password hashing
    const users: Record<string, { password: string; role: string; displayName: string }> = {
      admin: { password: 'admin123', role: 'admin', displayName: '管理员' },
      bar: { password: 'bar123', role: 'bar', displayName: '吧台小李' },
      service: { password: 'service123', role: 'service', displayName: '客服小王' },
      manager: { password: 'manager123', role: 'manager', displayName: '经理张总' },
    }

    const user = users[username]

    if (!user || user.password !== password) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // In production, create a proper JWT token or session
    const response = NextResponse.json({
      success: true,
      user: {
        username,
        role: user.role,
        displayName: user.displayName,
      },
    })

    // Set a simple cookie for demo
    response.cookies.set('auth', JSON.stringify({ username, role: user.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
