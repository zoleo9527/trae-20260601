<script lang="ts">
	import type { ConsumptionStatus, MakeupStatus } from '$lib/types';

	let { status, type = 'consumption' }: { status: ConsumptionStatus | MakeupStatus; type?: 'consumption' | 'makeup' } = $props();

	const config = $derived(getStatusConfig(status, type));

	function getStatusConfig(status: string, type: string) {
		if (type === 'consumption') {
			switch (status) {
				case 'pending':
					return { text: '待确认', bg: 'bg-amber-50', textColor: 'text-amber-700', border: 'border-amber-200' };
				case 'confirmed':
					return { text: '已确认', bg: 'bg-teal-50', textColor: 'text-teal-700', border: 'border-teal-200' };
				case 'rejected':
					return { text: '已驳回', bg: 'bg-red-50', textColor: 'text-red-700', border: 'border-red-200' };
				default:
					return { text: status, bg: 'bg-gray-50', textColor: 'text-gray-700', border: 'border-gray-200' };
			}
		} else {
			switch (status) {
				case 'pending':
					return { text: '待安排', bg: 'bg-amber-50', textColor: 'text-amber-700', border: 'border-amber-200' };
				case 'scheduled':
					return { text: '待上课', bg: 'bg-blue-50', textColor: 'text-blue-700', border: 'border-blue-200' };
				case 'completed':
					return { text: '已完成', bg: 'bg-teal-50', textColor: 'text-teal-700', border: 'border-teal-200' };
				case 'cancelled':
					return { text: '已取消', bg: 'bg-gray-100', textColor: 'text-gray-600', border: 'border-gray-200' };
				default:
					return { text: status, bg: 'bg-gray-50', textColor: 'text-gray-700', border: 'border-gray-200' };
			}
		}
	}
</script>

<span
	class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border {config.bg} {config.textColor} {config.border}"
>
	{config.text}
</span>
