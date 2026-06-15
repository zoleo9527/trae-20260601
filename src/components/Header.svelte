<script>
  import { currentUser } from '$lib/store';
  
  let user = {};
  currentUser.subscribe(u => user = u);
  
  const roles = {
    guide: '导购',
    designer: '设计师',
    warehouse: '仓库员'
  };
  
  const roleColors = {
    guide: '#4CAF50',
    designer: '#2196F3',
    warehouse: '#FF9800'
  };
</script>

<header class="header">
  <div class="header-left">
    <h1>瓷砖门店送货排期与铺贴反馈系统</h1>
  </div>
  <div class="header-right">
    <div class="user-info">
      <span class="role-badge" style="background-color: {roleColors[user.role]}">
        {roles[user.role]}
      </span>
      <span class="user-name">{user.name}</span>
    </div>
    <div class="nav-links">
      <a href="#orders">订单列表</a>
      <a href="#delivery">送货排期</a>
      <a href="#installation">铺贴反馈</a>
      <a href="#batch">批量处理</a>
    </div>
  </div>
</header>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .header-left h1 {
    font-size: 1.4rem;
    font-weight: 600;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 2rem;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .role-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
  }
  
  .user-name {
    font-weight: 500;
  }
  
  .nav-links {
    display: flex;
    gap: 1.5rem;
  }
  
  .nav-links a {
    color: rgba(255,255,255,0.9);
    text-decoration: none;
    font-size: 0.9rem;
    padding: 0.5rem 0;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  
  .nav-links a:hover {
    color: white;
    border-bottom-color: white;
  }
</style>
