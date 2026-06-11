import { Dropdown, Button, Avatar, MenuProps } from 'antd';
import { UserOutlined, SwapOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { ROLE_LABELS } from '../types';

export default function RoleSwitcher() {
  const { currentUser, users, switchUser } = useAppStore();

  const items: MenuProps['items'] = users.map((user) => ({
    key: user.id,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar size={20} icon={<UserOutlined />} />
        <span>{user.name}</span>
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
          ({ROLE_LABELS[user.role]})
        </span>
      </div>
    ),
    disabled: user.id === currentUser?.id,
  }));

  return (
    <Dropdown menu={{ items, onClick: ({ key }) => switchUser(key) }}>
      <Button icon={<SwapOutlined />}>
        切换角色: {ROLE_LABELS[currentUser?.role || 'manager']}
      </Button>
    </Dropdown>
  );
}
