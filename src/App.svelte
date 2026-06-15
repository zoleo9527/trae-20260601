<script>
  import Header from './components/Header.svelte';
  import OrderList from './components/OrderList.svelte';
  import OrderDetail from './components/OrderDetail.svelte';
  import DeliverySchedule from './components/DeliverySchedule.svelte';
  import InstallationFeedback from './components/InstallationFeedback.svelte';
  import BatchProcess from './components/BatchProcess.svelte';
</script>

<div class="app-container">
  <Header />
  
  <main class="main-content">
    <div class="dashboard-stats">
      <div class="stat-card">
        <div class="stat-icon orders">📋</div>
        <div class="stat-info">
          <span class="stat-value">4</span>
          <span class="stat-label">订单总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon delivery">🚚</div>
        <div class="stat-info">
          <span class="stat-value">4</span>
          <span class="stat-label">送货排期</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon installation">🔧</div>
        <div class="stat-info">
          <span class="stat-value">2</span>
          <span class="stat-label">铺贴反馈</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending">⚠</div>
        <div class="stat-info">
          <span class="stat-value">1</span>
          <span class="stat-label">待处理问题</span>
        </div>
      </div>
    </div>
    
    <OrderList />
    <OrderDetail />
    <DeliverySchedule />
    <InstallationFeedback />
    <BatchProcess />
  </main>
  
  <footer class="footer">
    <p>瓷砖门店送货排期与铺贴反馈系统 © 2026</p>
  </footer>
</div>

<style>
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .main-content {
    flex: 1;
    padding-bottom: 2rem;
  }
  
  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    border-radius: 12px;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
  .stat-icon.orders { color: #1e3c72; }
  .stat-icon.delivery { color: #2196F3; }
  .stat-icon.installation { color: #FF9800; }
  .stat-icon.pending { color: #F44336; }
  
  .stat-info {
    display: flex;
    flex-direction: column;
  }
  
  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #333;
  }
  
  .stat-label {
    font-size: 0.85rem;
    color: #666;
  }
  
  .footer {
    text-align: center;
    padding: 1.5rem;
    background-color: #f8f9fa;
    border-top: 1px solid #eee;
    color: #666;
    font-size: 0.9rem;
  }
</style>
