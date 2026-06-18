import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Role } from "@/types"

interface AuthUser { id: string; name: string; role: Role; token: string }
interface EntryConfig { title: string; desc: string; route: string; color: string }
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (u: AuthUser) => void;
  logout: () => void;
  getEntryConfig: () => EntryConfig | null;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (u) => set({ user: u, token: u.token }),
      logout: () => set({ user: null, token: null }),
      getEntryConfig: () => {
        const user = get().user;
        if (!user) return null;
        const m: Record<Role, EntryConfig> = {
          dispatcher: { title: "调度面板", desc: "预约单池、车辆排班、今日看板、异常中心", route: "/dispatcher", color: "#1677ff" },
          leader: { title: "组长面板", desc: "今日派工状态流转、异常上报", route: "/leader", color: "#52c41a" },
          customer: { title: "客服面板", desc: "预约单处理、异常处理、物损查看", route: "/customer", color: "#fa8c16" },
        };
        return m[user.role];
      },
    }),
    { name: "app-auth-storage" }
  )
);