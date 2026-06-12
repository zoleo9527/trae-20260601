import { XOutlined, BellOutlined, FileTextOutlined, AlertOutlined, CreditCardOutlined } from '@ant-design/icons'
import { Drawer, List, Tag } from 'antd'
import { Notification } from '@/types'

interface NotificationPanelProps {
  visible: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
}

const typeIcons: Record<string, typeof BellOutlined> = {
  task_assignment: BellOutlined,
  status_changed: FileTextOutlined,
  document_supplement: AlertOutlined,
  deposit_refund: CreditCardOutlined,
}

const typeColors: Record<string, string> = {
  task_assignment: 'blue',
  status_changed: 'green',
  document_supplement: 'orange',
  deposit_refund: 'gold',
}

const typeLabels: Record<string, string> = {
  task_assignment: '任务分配',
  status_changed: '状态变更',
  document_supplement: '资料补正',
  deposit_refund: '保证金退还',
}

export function NotificationPanel({ visible, onClose, notifications, onMarkAsRead }: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Drawer
      title={`通知消息 (${unreadCount} 未读)`}
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      closeIcon={<XOutlined />}
    >
      <List
        dataSource={notifications}
        renderItem={notification => {
          const Icon = typeIcons[notification.type] || BellOutlined
          return (
            <List.Item
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => onMarkAsRead(notification.id)}
            >
              <div className="notification-icon" style={{ color: typeColors[notification.type] }}>
                <Icon />
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <Tag color={typeColors[notification.type]}>
                    {typeLabels[notification.type]}
                  </Tag>
                  <span className="notification-time">{notification.createdAt}</span>
                </div>
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-body">{notification.content}</p>
              </div>
            </List.Item>
          )
        }}
      />
    </Drawer>
  )
}