import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, UserRole } from "@/types"

interface AuthState {
  user: User | null
  login: (user: User) => void
  logout: () => void
  getRole: () => UserRole | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      getRole: () => get().user?.role || null,
    }),
    {
      name: "flower-station-auth",
    }
  )
)
