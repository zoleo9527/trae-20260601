<script lang="ts">
  import { onMount } from 'svelte'
  import { 
    getAllRooms, 
    getAllReservations, 
    updateRoomStatus, 
    updateReservationStatus,
    addStatusLog,
    batchCheckIn,
    batchCheckOut,
    batchCleanComplete,
    getRoomById
  } from '$lib/database'
  import { 
    BedDouble, Users, Calendar, Phone, Wallet, 
    CheckCircle, Clock, AlertCircle, Search, Filter,
    ChevronRight, X, Plus, Check, Square, SquareCheck,
    RefreshCw, Users2
  } from 'lucide-svelte'
  
  import { writable } from 'svelte/store'

  let rooms: any[] = []
  let reservations: any[] = []
  let selectedRoom: any = null
  let showModal = false
  let searchQuery = ''
  let statusFilter = 'all'
  let roomTypeFilter = 'all'
  const selectedRooms = writable<number[]>([])
  let currentUser = '老板'
  
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    available: { label: '空闲', color: '#4CAF50', bg: '#E8F5E9' },
    occupied: { label: '入住中', color: '#F44336', bg: '#FFEBEE' },
    reserved: { label: '已预订', color: '#2196F3', bg: '#E3F2FD' },
    cleaning: { label: '打扫中', color: '#FF9800', bg: '#FFF3E0' }
  }
  
  const roomTypes = ['大床房', '标间', '套房']
  
  onMount(async () => {
    await loadData()
  })
  
  async function loadData() {
    const [roomsData, reservationsData] = await Promise.all([
      getAllRooms(),
      getAllReservations()
    ])
    
    rooms = roomsData
    
    for (const room of rooms) {
      const currentRes = reservationsData.find(r => 
        r.room_id === room.id && 
        (r.status === 'checked_in' || r.status === 'pending')
      )
      room.currentReservation = currentRes
    }
    
    reservations = reservationsData
    selectedRooms = []
  }
  
  function openRoomDetail(room: any) {
    selectedRoom = room
    showModal = true
  }
  
  function closeModal() {
    showModal = false
    selectedRoom = null
  }
  
  function toggleSelectRoom(roomId: number) {
    selectedRooms.update(rooms => {
      const index = rooms.indexOf(roomId)
      if (index > -1) {
        return rooms.filter(id => id !== roomId)
      } else {
        return [...rooms, roomId]
      }
    })
  }
  
  function selectAllRooms() {
    const filtered = getFilteredRooms()
    selectedRooms.update(current => {
      if (current.length === filtered.length && filtered.length > 0) {
        return []
      } else {
        return filtered.map(r => r.id)
      }
    })
  }
  
  async function handleCheckIn(roomId: number) {
    const reservation = reservations.find(r => 
      r.room_id === roomId && r.status === 'pending'
    )
    
    if (reservation) {
      await updateRoomStatus(roomId, 'occupied')
      await updateReservationStatus(reservation.id, 'checked_in')
      await addStatusLog(roomId, 'occupied', currentUser, `客人 ${reservation.guest_name} 办理入住`)
      await loadData()
      closeModal()
    }
  }
  
  async function handleCheckOut(roomId: number) {
    const reservation = reservations.find(r => 
      r.room_id === roomId && r.status === 'checked_in'
    )
    
    if (reservation) {
      await updateRoomStatus(roomId, 'cleaning')
      await updateReservationStatus(reservation.id, 'completed')
      await addStatusLog(roomId, 'cleaning', currentUser, `客人 ${reservation.guest_name} 已退房，等待打扫`)
      await loadData()
      closeModal()
    }
  }
  
  async function handleCleanComplete(roomId: number) {
    await updateRoomStatus(roomId, 'available')
    await addStatusLog(roomId, 'available', currentUser, '房间打扫完成')
    await loadData()
    closeModal()
  }
  
  async function handleBatchCheckIn() {
    const currentSelected = $selectedRooms
    if (currentSelected.length === 0) {
      alert('请先选择要办理入住的房间')
      return
    }
    await batchCheckIn([...currentSelected], currentUser)
    selectedRooms.set([])
    await loadData()
  }
  
  async function handleBatchCheckOut() {
    const currentSelected = $selectedRooms
    if (currentSelected.length === 0) {
      alert('请先选择要办理退房的房间')
      return
    }
    await batchCheckOut([...currentSelected], currentUser)
    selectedRooms.set([])
    await loadData()
  }
  
  async function handleBatchCleanComplete() {
    const currentSelected = $selectedRooms
    if (currentSelected.length === 0) {
      alert('请先选择已打扫完成的房间')
      return
    }
    await batchCleanComplete([...currentSelected], currentUser)
    selectedRooms.set([])
    await loadData()
  }
  
  function getFilteredRooms() {
    return rooms.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter
      const matchesType = roomTypeFilter === 'all' || room.type === roomTypeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }
  
  function getStatusCounts() {
    return {
      available: rooms.filter(r => r.status === 'available').length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      reserved: rooms.filter(r => r.status === 'reserved').length,
      cleaning: rooms.filter(r => r.status === 'cleaning').length
    }
  }
  
  function getSelectedCounts() {
    const selected = rooms.filter(r => $selectedRooms.includes(r.id))
    return {
      total: selected.length,
      pending: selected.filter(r => r.status === 'reserved' && r.currentReservation?.status === 'pending').length,
      occupied: selected.filter(r => r.status === 'occupied').length,
      cleaning: selected.filter(r => r.status === 'cleaning').length
    }
  }
</script>

<div class="rooms-page">
  <div class="page-header">
    <div class="header-info">
      <h1>住宿管理</h1>
      <p>房间状态概览与入住退房管理</p>
    </div>
    <div class="status-summary">
      <div class="status-item">
        <span class="status-dot" style="background: #4CAF50"></span>
        <span>空闲 {getStatusCounts().available}</span>
      </div>
      <div class="status-item">
        <span class="status-dot" style="background: #F44336"></span>
        <span>入住中 {getStatusCounts().occupied}</span>
      </div>
      <div class="status-item">
        <span class="status-dot" style="background: #2196F3"></span>
        <span>已预订 {getStatusCounts().reserved}</span>
      </div>
      <div class="status-item">
        <span class="status-dot" style="background: #FF9800"></span>
        <span>打扫中 {getStatusCounts().cleaning}</span>
      </div>
    </div>
  </div>
  
  <div class="filter-bar">
    <div class="search-box">
      <Search class="search-icon" />
      <input 
        type="text" 
        placeholder="搜索房间名称..." 
        bind:value={searchQuery}
      />
    </div>
    <div class="filter-group">
      <Filter class="filter-icon" />
      <select bind:value={statusFilter}>
        <option value="all">全部状态</option>
        {#each Object.keys(statusConfig) as status}
          <option value={status}>{statusConfig[status].label}</option>
        {/each}
      </select>
      <select bind:value={roomTypeFilter}>
        <option value="all">全部房型</option>
        {#each roomTypes as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
    </div>
    <button class="btn-refresh" on:click={loadData}>
      <RefreshCw class="refresh-icon" />
      刷新
    </button>
  </div>
  
  {#if $selectedRooms.length > 0}
    <div class="batch-actions">
      <div class="selected-info">
        <Users2 class="selected-icon" />
        <span>已选择 {$selectedRooms.length} 间房间</span>
      </div>
      <div class="action-buttons">
        {#if getSelectedCounts().pending > 0}
          <button class="btn-batch btn-checkin" on:click={handleBatchCheckIn}>
            <CheckCircle class="btn-icon" />
            批量入住 ({getSelectedCounts().pending})
          </button>
        {/if}
        {#if getSelectedCounts().occupied > 0}
          <button class="btn-batch btn-checkout" on:click={handleBatchCheckOut}>
            <Clock class="btn-icon" />
            批量退房 ({getSelectedCounts().occupied})
          </button>
        {/if}
        {#if getSelectedCounts().cleaning > 0}
          <button class="btn-batch btn-clean" on:click={handleBatchCleanComplete}>
            <Check class="btn-icon" />
            批量完成打扫 ({getSelectedCounts().cleaning})
          </button>
        {/if}
        <button class="btn-batch btn-cancel" on:click={() => selectedRooms.set([])}>
          取消选择
        </button>
      </div>
    </div>
  {/if}
  
  <div class="rooms-grid">
    <div 
      class="room-card select-all"
      on:click={selectAllRooms}
    >
      <div class="select-checkbox">
        {#if $selectedRooms.length === getFilteredRooms().length && getFilteredRooms().length > 0}
          <SquareCheck class="check-icon" />
        {:else}
          <Square class="check-icon" />
        {/if}
      </div>
      <div class="select-text">
        {$selectedRooms.length === getFilteredRooms().length && getFilteredRooms().length > 0 ? '取消全选' : '全选'}
      </div>
    </div>
    
    {#each getFilteredRooms() as room}
      <div 
        class="room-card"
        class:selected={$selectedRooms.includes(room.id)}
        style="border-color: {statusConfig[room.status].color}"
        on:click={() => openRoomDetail(room)}
      >
        <div class="select-checkbox" on:click|stopPropagation={() => toggleSelectRoom(room.id)}>
          {#if $selectedRooms.includes(room.id)}
            <SquareCheck class="check-icon" />
          {:else}
            <Square class="check-icon" />
          {/if}
        </div>
        
        <div class="room-header">
          <h3>{room.name}</h3>
          <span 
            class="status-badge"
            style="background: {statusConfig[room.status].bg}; color: {statusConfig[room.status].color}"
          >
            {statusConfig[room.status].label}
          </span>
        </div>
        <div class="room-info">
          <div class="info-row">
            <BedDouble class="info-icon" />
            <span>{room.type}</span>
          </div>
          <div class="info-row">
            <Users class="info-icon" />
            <span>最多入住 {room.capacity} 人</span>
          </div>
          <div class="info-row">
            <span class="price">¥{room.price}/晚</span>
          </div>
        </div>
        {#if room.currentReservation}
          <div class="current-guest">
            <div class="guest-name">{room.currentReservation.guest_name}</div>
            <div class="guest-detail">
              {room.currentReservation.status === 'checked_in' ? '已入住' : '待入住'}
            </div>
          </div>
        {/if}
        <ChevronRight class="arrow-icon" />
      </div>
    {/each}
  </div>
  
  <div class="workflow-section">
    <h2>房态交接流程</h2>
    <div class="workflow-flow">
      <div class="workflow-step">
        <div class="step-circle">1</div>
        <div class="step-content">
          <div class="step-title">老板办理入住</div>
          <div class="step-desc">确认客人信息，收取押金，分配房间</div>
        </div>
        <div class="step-arrow">→</div>
      </div>
      <div class="workflow-step">
        <div class="step-circle">2</div>
        <div class="step-content">
          <div class="step-title">客人入住</div>
          <div class="step-desc">客人进入房间，开始住宿</div>
        </div>
        <div class="step-arrow">→</div>
      </div>
      <div class="workflow-step">
        <div class="step-circle">3</div>
        <div class="step-content">
          <div class="step-title">老板办理退房</div>
          <div class="step-desc">确认退房，退还押金</div>
        </div>
        <div class="step-arrow">→</div>
      </div>
      <div class="workflow-step">
        <div class="step-circle">4</div>
        <div class="step-content">
          <div class="step-title">客房阿姨打扫</div>
          <div class="step-desc">清洁房间，准备下次入住</div>
        </div>
        <div class="step-arrow">→</div>
      </div>
      <div class="workflow-step last">
        <div class="step-circle">5</div>
        <div class="step-content">
          <div class="step-title">房间空闲</div>
          <div class="step-desc">等待新的预订</div>
        </div>
      </div>
    </div>
  </div>
  
  {#if showModal && selectedRoom}
    <div class="modal-overlay" on:click={closeModal}>
      <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
          <div>
            <h2>{selectedRoom.name}</h2>
            <span 
              class="status-badge"
              style="background: {statusConfig[selectedRoom.status].bg}; color: {statusConfig[selectedRoom.status].color}"
            >
              {statusConfig[selectedRoom.status].label}
            </span>
          </div>
          <button class="close-btn" on:click={closeModal}>
            <X class="close-icon" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="room-details">
            <div class="detail-item">
              <span class="detail-label">房型</span>
              <span>{selectedRoom.type}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">价格</span>
              <span>¥{selectedRoom.price}/晚</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">容量</span>
              <span>{selectedRoom.capacity} 人</span>
            </div>
          </div>
          
          {#if selectedRoom.currentReservation}
            <div class="reservation-section">
              <h3>当前客人信息</h3>
              <div class="guest-info">
                <div class="info-row">
                  <Users class="info-icon" />
                  <span>{selectedRoom.currentReservation.guest_name}</span>
                </div>
                <div class="info-row">
                  <Phone class="info-icon" />
                  <span>{selectedRoom.currentReservation.phone}</span>
                </div>
                <div class="info-row">
                  <Calendar class="info-icon" />
                  <span>{selectedRoom.currentReservation.check_in} ~ {selectedRoom.currentReservation.check_out}</span>
                </div>
                <div class="info-row">
                  <Users class="info-icon" />
                  <span>入住人数: {selectedRoom.currentReservation.guests} 人</span>
                </div>
                <div class="info-row">
                  <Wallet class="info-icon" />
                  <span>押金: ¥{selectedRoom.currentReservation.deposit}</span>
                </div>
              </div>
            </div>
          {/if}
          
          <div class="action-section">
            <h3>操作</h3>
            <div class="action-buttons">
              {#if selectedRoom.status === 'reserved' && selectedRoom.currentReservation?.status === 'pending'}
                <button class="btn-checkin" on:click={() => handleCheckIn(selectedRoom.id)}>
                  <CheckCircle class="btn-icon" />
                  办理入住
                </button>
              {/if}
              {#if selectedRoom.status === 'occupied'}
                <button class="btn-checkout" on:click={() => handleCheckOut(selectedRoom.id)}>
                  <Clock class="btn-icon" />
                  办理退房
                </button>
              {/if}
              {#if selectedRoom.status === 'cleaning'}
                <button class="btn-clean" on:click={() => handleCleanComplete(selectedRoom.id)}>
                  <Check class="btn-icon" />
                  打扫完成
                </button>
              {/if}
              {#if selectedRoom.status === 'available'}
                <button class="btn-reserve">
                  <Plus class="btn-icon" />
                  新增预订
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .rooms-page {
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1.5rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  
  .header-info h1 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
  }
  
  .header-info p {
    color: #666;
    margin: 0;
  }
  
  .status-summary {
    display: flex;
    gap: 1.5rem;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 1rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  
  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f5f5f5;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    flex: 1;
    max-width: 300px;
  }
  
  .search-icon {
    width: 18px;
    height: 18px;
    color: #999;
  }
  
  .search-box input {
    border: none;
    background: transparent;
    width: 100%;
    font-size: 0.9rem;
  }
  
  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .filter-icon {
    width: 18px;
    height: 18px;
    color: #999;
  }
  
  .filter-group select {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  
  .btn-refresh {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f5f5f5;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .refresh-icon {
    width: 18px;
    height: 18px;
  }
  
  .batch-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem 1.5rem;
    background: #E8F5E9;
    border-radius: 8px;
  }
  
  .selected-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #4CAF50;
  }
  
  .selected-icon {
    width: 20px;
    height: 20px;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.75rem;
  }
  
  .btn-batch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.3s;
  }
  
  .btn-batch.btn-checkin {
    background: #4CAF50;
    color: white;
  }
  
  .btn-batch.btn-checkin:hover {
    background: #45a049;
  }
  
  .btn-batch.btn-checkout {
    background: #2196F3;
    color: white;
  }
  
  .btn-batch.btn-checkout:hover {
    background: #1976D2;
  }
  
  .btn-batch.btn-clean {
    background: #FF9800;
    color: white;
  }
  
  .btn-batch.btn-clean:hover {
    background: #F57C00;
  }
  
  .btn-batch.btn-cancel {
    background: #f5f5f5;
    color: #666;
  }
  
  .rooms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .room-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: all 0.3s;
    border-left: 4px solid;
    position: relative;
  }
  
  .room-card.selected {
    border: 2px solid #4CAF50;
    background: #FAFAFA;
  }
  
  .room-card.select-all {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    border-left: none;
    border: 2px dashed #ddd;
    cursor: pointer;
  }
  
  .select-checkbox {
    position: absolute;
    top: 1rem;
    right: 1rem;
    cursor: pointer;
  }
  
  .room-card.select-all .select-checkbox {
    position: static;
  }
  
  .check-icon {
    width: 20px;
    height: 20px;
    color: #4CAF50;
  }
  
  .select-text {
    font-weight: 600;
    color: #666;
  }
  
  .room-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }
  
  .room-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .room-header h3 {
    font-size: 1.1rem;
    margin: 0;
    color: #333;
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .room-info {
    margin-bottom: 1rem;
  }
  
  .info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .info-icon {
    width: 16px;
    height: 16px;
    color: #999;
  }
  
  .price {
    font-size: 1.2rem;
    font-weight: bold;
    color: #4CAF50;
  }
  
  .current-guest {
    background: #f8f9fa;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .guest-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .guest-detail {
    font-size: 0.85rem;
    color: #666;
  }
  
  .arrow-icon {
    position: absolute;
    right: 1.5rem;
    bottom: 1.5rem;
    width: 20px;
    height: 20px;
    color: #999;
  }
  
  .workflow-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    margin-top: 2rem;
  }
  
  .workflow-section h2 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #f0f0f0;
  }
  
  .workflow-flow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }
  
  .workflow-step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .workflow-step.last {
    flex: 1;
  }
  
  .step-circle {
    width: 36px;
    height: 36px;
    background: #4CAF50;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
  }
  
  .step-content {
    flex: 1;
    min-width: 120px;
  }
  
  .step-title {
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;
  }
  
  .step-desc {
    font-size: 0.8rem;
    color: #666;
  }
  
  .step-arrow {
    font-size: 1.5rem;
    color: #ddd;
    margin-left: 0.5rem;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .modal-header h2 {
    margin: 0 0 0.5rem 0;
  }
  
  .close-btn {
    background: #f5f5f5;
    border: none;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
  }
  
  .close-icon {
    width: 20px;
    height: 20px;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .room-details {
    margin-bottom: 1.5rem;
  }
  
  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .detail-label {
    color: #999;
  }
  
  .reservation-section {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }
  
  .reservation-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }
  
  .guest-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .action-section {
    border-top: 1px solid #f0f0f0;
    padding-top: 1rem;
  }
  
  .action-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }
  
  .action-buttons button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s;
  }
  
  .btn-checkin {
    background: #4CAF50;
    color: white;
  }
  
  .btn-checkin:hover {
    background: #45a049;
  }
  
  .btn-checkout {
    background: #2196F3;
    color: white;
  }
  
  .btn-checkout:hover {
    background: #1976D2;
  }
  
  .btn-clean {
    background: #FF9800;
    color: white;
  }
  
  .btn-clean:hover {
    background: #F57C00;
  }
  
  .btn-reserve {
    background: #9C27B0;
    color: white;
  }
  
  .btn-reserve:hover {
    background: #7B1FA2;
  }
  
  .btn-icon {
    width: 18px;
    height: 18px;
  }
</style>