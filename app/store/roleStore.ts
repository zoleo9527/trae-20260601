import { create } from "zustand";
import type { Role } from "~/types";
import { ROLE_DEFAULT_NAMES } from "~/types";

interface RoleState {
  currentRole: Role;
  setCurrentRole: (r: Role) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  currentRole: "supervisor",
  setCurrentRole: (r) => set({ currentRole: r }),
}));

export function getRoleDefaultName(role: Role): string {
  return ROLE_DEFAULT_NAMES[role];
}
