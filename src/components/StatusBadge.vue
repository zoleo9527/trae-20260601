<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClass"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { InspectionStatus, RepairStatus } from "@/types";
import { useGasStationStore } from "@/stores/gasStation";

const props = defineProps<{
  type: "inspection" | "repair";
  status: InspectionStatus | RepairStatus;
}>();

const store = useGasStationStore();

const label = computed(() => {
  if (props.type === "inspection") {
    return store.inspectionStatusLabel(props.status as InspectionStatus);
  }
  return store.repairStatusLabel(props.status as RepairStatus);
});

const badgeClass = computed(() => {
  const inspectionColors: Record<InspectionStatus, string> = {
    pending: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    abnormal: "bg-red-100 text-red-800",
    recheck: "bg-yellow-100 text-yellow-800",
  };

  const repairColors: Record<RepairStatus, string> = {
    submitted: "bg-gray-100 text-gray-800",
    assigned: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    waiting_parts: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    verified: "bg-teal-100 text-teal-800",
    closed: "bg-gray-200 text-gray-600",
  };

  if (props.type === "inspection") {
    return inspectionColors[props.status as InspectionStatus];
  }
  return repairColors[props.status as RepairStatus];
});
</script>
