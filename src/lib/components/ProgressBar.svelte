<script lang="ts">
	let { value, max, color } = $props<{
		value: number;
		max: number;
		color?: string;
	}>();

	const percentage = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);

	const barColor = $derived(() => {
		if (color) return color;
		if (percentage < 20) return 'bg-red-500';
		if (percentage < 50) return 'bg-orange-500';
		return 'bg-teal-500';
	});

	const textColor = $derived(() => {
		if (percentage < 20) return 'text-red-600';
		if (percentage < 50) return 'text-orange-600';
		return 'text-teal-600';
	});
</script>

<div class="w-full">
	<div class="flex items-center justify-between mb-1">
		<span class="text-sm text-gray-600">{value} / {max} 课时</span>
		<span class="text-sm font-semibold {textColor}">{percentage.toFixed(0)}%</span>
	</div>
	<div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
		<div
			class="{barColor} h-full rounded-full transition-all duration-500 ease-out"
			style="width: {percentage}%"
		></div>
	</div>
</div>
