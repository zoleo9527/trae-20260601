import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Flower2, Truck, HeadphonesIcon, Search } from "lucide-react"
import type { User, UserRole } from "@/types"
import { ROLE_LABELS } from "@/types"
import { useAuthStore } from "@/store/auth"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, login } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const rolePaths: Record<UserRole, string> = {
        FLORIST: "/florist",
        DISPATCHER: "/dispatcher",
        AFTERCARE: "/aftercare",
      }
      navigate(rolePaths[user.role])
      return
    }

    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user, navigate])

  const handleLogin = async (selectedUser: User) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id }),
      })
      const data = await res.json()
      if (data.success) {
        login(data.user)
        const rolePaths: Record<UserRole, string> = {
          FLORIST: "/florist",
          DISPATCHER: "/dispatcher",
          AFTERCARE: "/aftercare",
        }
        navigate(rolePaths[data.user.role])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const roleStyles: Record<UserRole, { gradient: string; icon: string; border: string }> = {
    FLORIST: {
      gradient: "from-pink-500/20 to-rose-500/10",
      icon: "text-pink-400",
      border: "hover:border-pink-500/50 hover:shadow-[0_0_30px_-10px_rgba(236,72,153,0.4)]",
    },
    DISPATCHER: {
      gradient: "from-amber-500/20 to-orange-500/10",
      icon: "text-amber-400",
      border: "hover:border-amber-500/50 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.4)]",
    },
    AFTERCARE: {
      gradient: "from-emerald-500/20 to-teal-500/10",
      icon: "text-emerald-400",
      border: "hover:border-emerald-500/50 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.4)]",
    },
  }

  const roleIcons: Record<UserRole, React.ReactNode> = {
    FLORIST: <Flower2 size={36} />,
    DISPATCHER: <Truck size={36} />,
    AFTERCARE: <HeadphonesIcon size={36} />,
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-zinc-100 flex flex-col items-center justify-center p-8">
      <div className="mb-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-amber-500 flex items-center justify-center">
          <Search size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">鲜花配送站</h1>
        <p className="text-zinc-500">花材采购 · 到货分级 · 链路追踪</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse"
            />
          ))
        ) : (
          users.map((u) => (
            <button
              key={u.id}
              onClick={() => handleLogin(u)}
              className={cn(
                "group relative p-8 rounded-2xl border border-zinc-800 bg-gradient-to-br transition-all duration-300",
                "text-left hover:scale-[1.02]",
                roleStyles[u.role].gradient,
                roleStyles[u.role].border
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-xl bg-zinc-900/80 flex items-center justify-center mb-4",
                  roleStyles[u.role].icon
                )}
              >
                {roleIcons[u.role]}
              </div>
              <h3 className="text-xl font-bold mb-1">{u.name}</h3>
              <p className={cn("text-sm mb-3", roleStyles[u.role].icon)}>
                {ROLE_LABELS[u.role]}入口
              </p>
              <p className="text-xs text-zinc-500">
                {u.role === "FLORIST" && "发起花材采购、填写备注、查看分级结果"}
                {u.role === "DISPATCHER" && "待分级队列、执行到货分级、异常退回"}
                {u.role === "AFTERCARE" && "全量单据回查、申诉处理、链路追踪"}
              </p>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 text-xs">
                点击进入 →
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mt-12 text-center text-xs text-zinc-600 max-w-md">
        <p>💡 演示说明：选择角色即登录，无需密码</p>
        <p className="mt-1">采购备注自动传递到到货分级环节，流程自然衔接</p>
      </div>
    </div>
  )
}
