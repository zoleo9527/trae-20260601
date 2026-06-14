<script lang="ts">
  import { onMount } from 'svelte';
  
  interface Stat {
    total: number;
    present: number;
    absent: number;
    late: number;
    absentRate: number;
  }
  
  interface Workload {
    invigilator: { name: string; department: string };
    count: number;
    hours: number;
  }
  
  interface AnomalyStat {
    type: string;
    count: number;
  }
  
  let absentStat = null;
  let workload = [];
  let anomalyStats = [];
  let loading = true;
  
  onMount(async () => {
    await loadStats();
  });
  
  async function loadStats() {
    loading = true;
    try {
      const [absentRes, workloadRes, anomalyRes] = await Promise.all([
        fetch('/api/statistics/absent'),
        fetch('/api/statistics/invigilator-workload'),
        fetch('/api/statistics/anomalies')
      ]);
      
      if (absentRes.ok) {
        absentStat = await absentRes.json();
      }
      
      if (workloadRes.ok) {
        const data = await workloadRes.json();
        workload = data.workload || [];
      }
      
      if (anomalyRes.ok) {
        const data = await anomalyRes.json();
        anomalyStats = data.byType || [];
      }
    } catch (e) {
      console.error('加载统计数据失败:', e);
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <div class="text-center py-12 text-gray-500">加载中...</div>
{:else}
  <div class="space-y-6">
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">缺考统计</h3>
      
      {#if absentStat}
        <div class="grid grid-cols-5 gap-4">
          <div class="text-center p-4 rounded-md bg-gray-50">
            <div class="text-3xl font-bold text-gray-800">{absentStat.total}</div>
            <div class="text-sm text-gray-500 mt-1">总人数</div>
          </div>
          
          <div class="text-center p-4 rounded-md bg-success/10">
            <div class="text-3xl font-bold text-success">{absentStat.present}</div>
            <div class="text-sm text-gray-500 mt-1">已签到</div>
          </div>
          
          <div class="text-center p-4 rounded-md bg-danger/10">
            <div class="text-3xl font-bold text-danger">{absentStat.absent}</div>
            <div class="text-sm text-gray-500 mt-1">缺考</div>
          </div>
          
          <div class="text-center p-4 rounded-md bg-warning/10">
            <div class="text-3xl font-bold text-warning">{absentStat.late}</div>
            <div class="text-sm text-gray-500 mt-1">迟到</div>
          </div>
          
          <div class="text-center p-4 rounded-md bg-primary-50">
            <div class="text-3xl font-bold text-primary">{absentStat.absentRate.toFixed(1)}%</div>
            <div class="text-sm text-gray-500 mt-1">缺考率</div>
          </div>
        </div>
      {:else}
        <div class="text-center py-8 text-gray-500">暂无统计数据</div>
      {/if}
    </div>
    
    <div class="grid grid-cols-2 gap-6">
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">监考工作量统计</h3>
        
        {#if workload.length === 0}
          <div class="text-center py-8 text-gray-500">暂无数据</div>
        {:else}
          <div class="space-y-3">
            {#each workload as item}
              <div class="flex items-center justify-between p-3 rounded-md bg-gray-50">
                <div>
                  <div class="font-medium text-gray-800">{item.invigilator.name}</div>
                  <div class="text-sm text-gray-500">{item.invigilator.department}</div>
                </div>
                <div class="text-right">
                  <div class="font-semibold text-primary">{item.count} 次</div>
                  <div class="text-sm text-gray-500">{item.hours} 小时</div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">异常分析</h3>
        
        {#if anomalyStats.length === 0}
          <div class="text-center py-8 text-gray-500">暂无异常数据</div>
        {:else}
          <div class="space-y-3">
            {#each anomalyStats as stat}
              <div class="flex items-center justify-between p-3 rounded-md bg-gray-50">
                <div class="font-medium text-gray-800">{stat.type}</div>
                <div class="font-semibold text-danger">{stat.count} 次</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}