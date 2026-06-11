import type { Role } from "~/types";
import { ROLE_DEFAULT_NAMES } from "~/types";
import type { MaintenanceContract, FollowUpNote } from "~/types";

const ROLE_COOKIE_NAME = "fm_role";
const DEFAULT_ROLE: Role = "supervisor";

export function getRoleFromRequest(request: Request): Role {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return DEFAULT_ROLE;
  const match = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(ROLE_COOKIE_NAME + "="));
  if (!match) return DEFAULT_ROLE;
  const value = decodeURIComponent(match.slice(ROLE_COOKIE_NAME.length + 1));
  if (value === "supervisor" || value === "property" || value === "engineer") {
    return value as Role;
  }
  return DEFAULT_ROLE;
}

export function setRoleCookie(role: Role): string {
  return `${ROLE_COOKIE_NAME}=${encodeURIComponent(role)}; Path=/; SameSite=Lax; Max-Age=2592000`;
}

export function sanitizeContractForRole(
  contract: MaintenanceContract,
  role: Role
): MaintenanceContract {
  if (role !== "property") return contract;

  return {
    ...contract,
    followUps: contract.followUps.filter((fu) => !fu.isInternal),
    renewal: {
      ...contract.renewal,
      notes: contract.renewal.notes
        ? "（内部备注已隐藏，请联系维保主管）"
        : contract.renewal.notes,
    },
  };
}

export function sanitizeContractsForRole(
  contracts: MaintenanceContract[],
  role: Role
): MaintenanceContract[] {
  return contracts.map((c) => sanitizeContractForRole(c, role));
}

export function resolveServerPersonName(
  contract: MaintenanceContract,
  role: Role
): string {
  const nameSet = new Set<string>();
  for (const fu of contract.followUps) {
    if (fu.authorRole === role) nameSet.add(fu.author);
  }
  for (const hd of contract.hiddenDangers) {
    if (hd.foundByRole === role) nameSet.add(hd.foundBy);
  }
  for (const insp of contract.inspections) {
    if (insp.inspectorRole === role) nameSet.add(insp.inspectorName);
  }
  if (role === "supervisor") nameSet.add(contract.contract.supervisorName);
  if (role === "property") nameSet.add(contract.contract.propertyContact);
  if (nameSet.size > 0) return Array.from(nameSet)[nameSet.size - 1];
  return ROLE_DEFAULT_NAMES[role];
}

export function canEditRenewal(role: Role): boolean {
  return role === "supervisor";
}

export function canEditDanger(role: Role): boolean {
  return role === "supervisor" || role === "engineer";
}

export function canMarkInternal(role: Role): boolean {
  return role !== "property";
}
