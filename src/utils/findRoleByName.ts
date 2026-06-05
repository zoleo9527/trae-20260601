import type { Complaint, Role } from "@/types"
import { ROLE_LABELS } from "@/types"

export function findRoleByName(complaint: Complaint, name: string): Role | null {
  for (let i = complaint.timeline.length - 1; i >= 0; i--) {
    if (complaint.timeline[i].author === name) {
      return complaint.timeline[i].role
    }
  }
  return null
}
