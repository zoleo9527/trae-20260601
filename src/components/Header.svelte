<script>
  import { pendingCount, stuckCount, urgentCount } from '../stores/reportStore'
</script>

<header class="header">
  <div class="header-left">
    <div class="logo">体</div>
    <div class="header-title">体检中心 · 报告审核与发放登记</div>
  </div>
  <div class="header-right">
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-dot urgent"></span>
        <span>紧急 <b>{$urgentCount}</b></span>
      </div>
      <div class="stat-item">
        <span class="stat-dot pending"></span>
        <span>待处理 <b>{$pendingCount}</b></span>
      </div>
      <div class="stat-item">
        <span class="stat-dot stuck"></span>
        <span>卡住 <b>{$stuckCount}</b></span>
      </div>
    </div>
    <div class="user-info">
      <div class="user-avatar">李</div>
      <span>李审核员</span>
    </div>
  </div>
</header>
