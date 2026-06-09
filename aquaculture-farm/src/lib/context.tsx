"use client";
import { createContext, useContext, useState, useEffect } from "react";

export type CurrentUser = { id: number; name: string; role: string };

const defaultRoleUsers: Record<string, CurrentUser> = {
  TECHNICIAN: { id: 0, name: "养殖技术员", role: "TECHNICIAN" },
  FEED_MANAGER: { id: 0, name: "饲料仓管", role: "FEED_MANAGER" },
  FARM_DIRECTOR: { id: 0, name: "场长", role: "FARM_DIRECTOR" },
};

export const CurrentUserContext = createContext<{
  user: CurrentUser;
  setUser: (u: CurrentUser) => void;
  roleUsers: Record<string, CurrentUser>;
}>({
  user: defaultRoleUsers.TECHNICIAN,
  setUser: () => {},
  roleUsers: defaultRoleUsers,
});

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [roleUsers, setRoleUsers] = useState<Record<string, CurrentUser>>(defaultRoleUsers);
  const [user, setUser] = useState<CurrentUser>(defaultRoleUsers.TECHNICIAN);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((users: CurrentUser[]) => {
        const map: Record<string, CurrentUser> = {};
        for (const u of users) {
          if (u.role === "TECHNICIAN" && !map.TECHNICIAN) map.TECHNICIAN = u;
          else if (u.role === "FEED_MANAGER" && !map.FEED_MANAGER) map.FEED_MANAGER = u;
          else if (u.role === "FARM_DIRECTOR" && !map.FARM_DIRECTOR) map.FARM_DIRECTOR = u;
        }
        if (Object.keys(map).length > 0) {
          setRoleUsers(map);
          setUser((prev) => map[prev.role] || map.TECHNICIAN);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, setUser, roleUsers }}>
      {children}
    </CurrentUserContext.Provider>
  );
}
