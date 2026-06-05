import type { Complaint, Role } from "@/types"
import { ROLE_DEFAULT_NAMES } from "@/types"

export function resolvePersonName(complaint: Complaint | undefined, role: Role): string {
  if (!complaint) return ROLE_DEFAULT_NAMES[role]
  for (let i = complaint.timeline.length - 1; i >= 0; i--) {
    if (complaint.timeline[i].role === role) {
      return complaint.timeline[i].author
    }
  }
  return ROLE_DEFAULT_NAMES[role]
}
