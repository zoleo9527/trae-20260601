import { Select } from 'antd'
import { useApp } from '../context/AppContext'

function RoleSwitch() {
  const { currentUser, login, users } = useApp()

  const handleChange = (userId) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      login(user)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '12px', background: '#fff', borderRadius: '8px' }}>
      <span style={{ fontWeight: 'bold' }}>当前角色：</span>
      <Select
        value={currentUser.id}
        onChange={handleChange}
        style={{ width: 180 }}
        options={users.map(user => ({
          value: user.id,
          label: `${user.name} (${user.roleName})`,
        }))}
      />
    </div>
  )
}

export default RoleSwitch