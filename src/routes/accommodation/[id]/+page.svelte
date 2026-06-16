<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { accommodations } from '$lib/stores/accommodations';
  import { page } from '$app/stores';
  import { formatDate } from '$lib/storage';
  import { goto } from '$app/navigation';
  
  $: accommodationId = $page.params.id;
  $: accommodation = accommodations.getById(accommodationId);
  
  function handleCheckOut() {
    if (accommodation) {
      accommodations.checkOut(accommodation.id);
      goto('/accommodation');
    }
  }
</script>

<svelte:head>
  <title>住宿详情 - 农家乐经营管理系统</title>
</svelte:head>

{#if accommodation}
  <div class="accommodation-detail">
    <div class="page-header">
      <a href="/accommodation" class="back-link">← 返回列表</a>
      <h2 class="page-title">住宿详情</h2>
    </div>
    
    <div class="detail-grid">
      <Card title="基本信息">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">客人姓名</span>
            <span class="info-value">{accommodation.guest_name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话</span>
            <span class="info-value">{accommodation.phone}</span>
          </div>
          <div class="info-item">
            <span class="info-label">房间号</span>
            <span class="info-value">{accommodation.room_number}</span>
          </div>
          <div class="info-item">
            <span class="info-label">入住时间</span>
            <span class="info-value">{formatDate(accommodation.check_in_time)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">退房时间</span>
            <span class="info-value">
              {accommodation.check_out_time ? formatDate(accommodation.check_out_time) : '未退房'}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <Badge 
              variant={accommodation.status === 'checked_in' ? 'success' : 'secondary'}
              size="sm"
            >
              {accommodation.status === 'checked_in' ? '已入住' : '已退房'}
            </Badge>
          </div>
          <div class="info-item">
            <span class="info-label">处理人</span>
            <span class="info-value">{accommodation.handler}</span>
          </div>
        </div>
      </Card>
      
      <Card title="操作">
        <div class="actions">
          {#if accommodation.status === 'checked_in'}
            <Button variant="danger" fullWidth on:click={handleCheckOut}>
              办理退房
            </Button>
          {:else}
            <div class="checked-out-info">
              该客人已退房
            </div>
          {/if}
        </div>
      </Card>
    </div>
    
    <Card title="入住信息">
      <div class="timeline-section">
        <div class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-title">办理入住</div>
            <div class="timeline-time">{formatDate(accommodation.check_in_time)}</div>
            <div class="timeline-handler">处理人：{accommodation.handler}</div>
          </div>
        </div>
        
        {#if accommodation.check_out_time}
          <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-title">办理退房</div>
              <div class="timeline-time">{formatDate(accommodation.check_out_time)}</div>
            </div>
          </div>
        {/if}
      </div>
    </Card>
  </div>
{:else}
  <div class="not-found">
    <h2>未找到住宿记录</h2>
    <Button variant="primary" href="/accommodation">返回住宿列表</Button>
  </div>
{/if}

<style>
  .accommodation-detail {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-link {
    color: #92400E;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .back-link:hover {
    color: #78350F;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #78350F;
    margin: 0;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-size: 0.75rem;
    color: #B45309;
    font-weight: 500;
  }

  .info-value {
    font-size: 0.875rem;
    color: #78350F;
    font-weight: 600;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .checked-out-info {
    text-align: center;
    color: #92400E;
    padding: 1rem;
    background-color: #FEF3C7;
    border-radius: 0.5rem;
  }

  .timeline-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .timeline-item {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .timeline-marker {
    width: 12px;
    height: 12px;
    background-color: #F59E0B;
    border-radius: 50%;
    margin-top: 4px;
  }

  .timeline-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .timeline-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #78350F;
  }

  .timeline-time {
    font-size: 0.75rem;
    color: #92400E;
  }

  .timeline-handler {
    font-size: 0.75rem;
    color: #B45309;
  }

  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
  }

  @media (max-width: 768px) {
    .detail-grid {
      grid-template-columns: 1fr;
    }
    
    .info-grid {
      grid-template-columns: 1fr;
    }
  }
</style>