import { useState, useEffect } from 'react'
import { Layout, Menu, Button } from 'antd'
import { BarChartOutlined, FileTextOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons'
import { Header } from '@/components/Header'
import { Dashboard } from '@/components/Dashboard'
import { AssetList } from '@/components/AssetList'
import { AssetDetail } from '@/components/AssetDetail'
import { AssetEntry } from '@/components/AssetEntry'
import { NotificationPanel } from '@/components/NotificationPanel'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { assetService } from '@/services/assetService'
import { Asset, UserRole, Notification, FilterParams } from '@/types'
import './App.scss'

const { Sider, Content } = Layout

type ViewMode = 'dashboard' | 'assetList'

function App() {
  const { user, switchRole } = useCurrentUser()
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>()
  const [showDetail, setShowDetail] = useState(false)
  const [showEntry, setShowEntry] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentRole, setCurrentRole] = useState<UserRole>(user.role)
  const [filterParams, setFilterParams] = useState<FilterParams>({})
  const [showFlowTab, setShowFlowTab] = useState(false)

  useEffect(() => {
    loadAssets()
    loadNotifications()
  }, [currentRole])

  useEffect(() => {
    setCurrentRole(user.role)
  }, [user])

  const loadAssets = (params?: FilterParams) => {
    setAssets(assetService.getAssets(params || filterParams))
  }

  const loadNotifications = () => {
    setNotifications(assetService.getNotifications())
  }

  const handleViewAsset = (assetId: string, showFlow = false) => {
    const asset = assetService.getAssetById(assetId)
    setSelectedAsset(asset)
    setShowFlowTab(showFlow)
    setShowDetail(true)
  }

  const handleEditAsset = (assetId: string) => {
    const asset = assetService.getAssetById(assetId)
    setSelectedAsset(asset)
    setShowDetail(true)
  }

  const handleUploadAttachment = (assetId: string) => {
    const asset = assetService.getAssetById(assetId)
    setSelectedAsset(asset)
    setShowDetail(true)
  }

  const handleSubmitReview = (assetId: string, status: string, comment: string) => {
    let targetStatus = status as AssetStatus
    if (status === 'review_approved') {
      targetStatus = 'pending_finance'
    }
    assetService.updateAssetStatus(assetId, targetStatus, user.id, comment)
    loadAssets()
    loadNotifications()
  }

  const handleSubmitFinance = (assetId: string, status: string, comment: string) => {
    let targetStatus = status as AssetStatus
    if (status === 'finance_approved') {
      targetStatus = 'completed'
    }
    assetService.updateAssetStatus(assetId, targetStatus, user.id, comment)
    loadAssets()
    loadNotifications()
  }

  const handleAssetEntry = (data: { name: string; code: string; category: string; location: string; estimatedValue: string }) => {
    const newAsset = {
      name: data.name,
      code: data.code,
      category: data.category,
      location: data.location,
      estimatedValue: parseFloat(data.estimatedValue) * 10000,
      status: 'entry_completed',
      submitter: user,
    }
    const asset = assetService.createAsset(newAsset)
    assetService.updateAssetStatus(asset.id, 'pending_review', user.id, '标的入库完成')
    loadAssets()
    loadNotifications()
  }

  const handleMarkNotificationAsRead = (id: string) => {
    assetService.markNotificationAsRead(id)
    loadNotifications()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const menuItems = [
    { key: 'dashboard', label: '今日待办', icon: <BarChartOutlined /> },
    { key: 'assetList', label: '标的管理', icon: <FileTextOutlined /> },
  ]

  const canCreateEntry = currentRole === 'project_manager'

  return (
    <Layout className="app-layout">
      <Header
        user={{ name: user.name, role: user.role }}
        notificationCount={unreadCount}
        onSwitchRole={switchRole}
        onOpenNotifications={() => setShowNotifications(true)}
      />
      
      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            selectedKeys={[viewMode]}
            items={menuItems}
            onClick={({ key }) => setViewMode(key as ViewMode)}
          />
        </Sider>
        
        <Content className="main-content">
          <div className="content-header">
            <h2>{viewMode === 'dashboard' ? '今日待办' : '标的管理'}</h2>
            <div className="content-actions">
              {viewMode === 'assetList' && canCreateEntry && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowEntry(true)}>
                  标的入库
                </Button>
              )}
              <Button icon={<SyncOutlined />} onClick={loadAssets}>
                刷新
              </Button>
            </div>
          </div>

          {viewMode === 'dashboard' ? (
            <Dashboard
              userRole={currentRole}
              todayTasks={assetService.getTasks()}
              stats={assetService.getAssetStatusStatistics()}
              onViewAsset={handleViewAsset}
            />
          ) : (
            <AssetList
              assets={assets}
              onViewAsset={handleViewAsset}
              onEditAsset={handleEditAsset}
              onUploadAttachment={handleUploadAttachment}
              onFilterChange={setFilterParams}
              onFilterApply={() => loadAssets()}
            />
          )}
        </Content>
      </Layout>

      <AssetDetail
        asset={selectedAsset}
        flowRecords={selectedAsset ? assetService.getFlowRecords(selectedAsset.id) : []}
        attachments={selectedAsset ? assetService.getAttachments(selectedAsset.id) : []}
        visible={showDetail}
        activeTab={showFlowTab ? 'flow' : 'info'}
        onClose={() => {
          setShowDetail(false)
          setShowFlowTab(false)
        }}
        onSubmitReview={handleSubmitReview}
        onSubmitFinance={handleSubmitFinance}
        userRole={currentRole}
      />

      <AssetEntry
        visible={showEntry}
        onClose={() => setShowEntry(false)}
        onSubmit={handleAssetEntry}
        currentUser={user}
      />

      <NotificationPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
      />
    </Layout>
  )
}

export default App