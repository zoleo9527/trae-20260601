"use client";
import { createContext, useContext } from "react";
export type CurrentUser = { id: number; name: string; role: string };
const roleUsers: Record<string, CurrentUser> = {
  TECHNICIAN: { id: 1, name: "张海宁", role: "TECHNICIAN" },
  FEED_MANAGER: { id: 3, name: "王仓管", role: "FEED_MANAGER" },
  FARM_DIRECTOR: { id: 4, name: "赵场长", role: "FARM_DIRECTOR" },
};
export const CurrentUserContext = createContext<{ user: CurrentUser; setUser: (u: CurrentUser) => void }>({ user: roleUsers.TECHNICIAN, setUser: () => {} });
export function useCurrentUser() { return useContext(CurrentUserContext); }
export { roleUsers };
