const fs = require('fs');

// 修复 Dashboard.jsx - 添加角色映射兼容
const dashboardContent = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
const fixedDashboard = dashboardContent.replace(
  "const ROLE_STYLES = {\n  assistant: { bg: '#e6f4ff', border: '#91caff', color: '#1677ff', title: '主播助理工作台' },\n  controller: { bg: '#fff7e6', border: '#ffd591', color: '#fa8c16', title: '场控工作台' },\n  lead: { bg: '#f6ffed', border: '#b7eb8f', color: '#52c41a', title: '售后组长工作台' }\n}",
  `const ROLE_STYLES = {
  assistant: { bg: '#e6f4ff', border: '#91caff', color: '#1677ff', title: '主播助理工作台' },
  controller: { bg: '#fff7e6', border: '#ffd591', color: '#fa8c16', title: '场控工作台' },
  lead: { bg: '#f6ffed', border: '#b7eb8f', color: '#52c41a', title: '售后组长工作台' },
  '主播助理': { bg: '#e6f4ff', border: '#91caff', color: '#1677ff', title: '主播助理工作台' },
  '场控': { bg: '#fff7e6', border: '#ffd591', color: '#fa8c16', title: '场控工作台' },
  '售后组长': { bg: '#f6ffed', border: '#b7eb8f', color: '#52c41a', title: '售后组长工作台' }
}`
).replace(
  "const roleStyle = ROLE_STYLES[user?.role] || ROLE_STYLES.assistant",
  `const getRoleKey = (role) => {
  const roleMap = {
    '主播助理': 'assistant',
    '场控': 'controller',
    '售后组长': 'lead',
    'assistant': 'assistant',
    'controller': 'controller',
    'lead': 'lead'
  }
  return roleMap[role] || 'assistant'
}

const roleKey = getRoleKey(user?.role)
const roleStyle = ROLE_STYLES[roleKey] || ROLE_STYLES.assistant`
).replace(
  "const renderRoleCard = () => {\n    const role = user?.role",
  `const renderRoleCard = () => {
    const role = getRoleKey(user?.role)`
);
fs.writeFileSync('src/pages/Dashboard.jsx', fixedDashboard, 'utf8');
console.log('Dashboard.jsx 修复完成');

// 修复 TicketDetail.jsx - 添加角色映射兼容
const ticketDetailContent = fs.readFileSync('src/pages/TicketDetail.jsx', 'utf8');
const fixedTicketDetail = ticketDetailContent.replace(
  "const ROLE_LABELS = {\n  assistant: '主播助理',\n  controller: '场控',\n  lead: '售后组长'\n}",
  `const ROLE_LABELS = {
  assistant: '主播助理',
  controller: '场控',
  lead: '售后组长',
  '主播助理': '主播助理',
  '场控': '场控',
  '售后组长': '售后组长'
}`
).replace(
  "const canPerformAction = (action) => {\n    if (!ticket || !user) return false\n    if (ticket.status === 'completed' || ticket.status === 'rejected') return false\n\n    if (ticket.type === 'refund') {\n      if (user.role === 'controller' || user.role === 'lead') {\n        return REFUND_FLOW[ticket.status]?.includes(action)\n      }\n      return false\n    }\n\n    if (ticket.type === 'reissue') {\n      if (user.role === 'lead') {\n        return REISSUE_FLOW[ticket.status]?.includes(action)\n      }\n      if (user.role === 'controller') {\n        return action === 'shipped' && ticket.status === 'approved'\n      }\n      return false\n    }\n\n    return false\n  }",
  `const getRoleKey = (role) => {
    const roleMap = {
      '主播助理': 'assistant',
      '场控': 'controller',
      '售后组长': 'lead',
      'assistant': 'assistant',
      'controller': 'controller',
      'lead': 'lead'
    }
    return roleMap[role] || 'assistant'
  }

  const canPerformAction = (action) => {
    if (!ticket || !user) return false
    if (ticket.status === 'completed' || ticket.status === 'rejected') return false
    const userRole = getRoleKey(user.role)

    if (ticket.type === 'refund') {
      if (userRole === 'controller' || userRole === 'lead') {
        return REFUND_FLOW[ticket.status]?.includes(action)
      }
      return false
    }

    if (ticket.type === 'reissue') {
      if (userRole === 'lead') {
        return REISSUE_FLOW[ticket.status]?.includes(action)
      }
      if (userRole === 'controller') {
        return action === 'shipped' && ticket.status === 'approved'
      }
      return false
    }

    return false
  }`
).replace(
  "<div style={{ fontSize: '13px', opacity: 0.9 }}>{ROLE_LABELS[user?.role] || user?.role}</div>",
  `<div style={{ fontSize: '13px', opacity: 0.9 }}>{ROLE_LABELS[user?.role] || user?.role || '-'}</div>`
);
fs.writeFileSync('src/pages/TicketDetail.jsx', fixedTicketDetail, 'utf8');
console.log('TicketDetail.jsx 修复完成');

// 修复 Header.jsx - 添加角色映射兼容
const headerContent = fs.readFileSync('src/components/Header.jsx', 'utf8');
const fixedHeader = headerContent.replace(
  "const ROLE_LABELS = {\n  assistant: '主播助理',\n  controller: '场控',\n  lead: '售后组长'\n}",
  `const ROLE_LABELS = {
  assistant: '主播助理',
  controller: '场控',
  lead: '售后组长',
  '主播助理': '主播助理',
  '场控': '场控',
  '售后组长': '售后组长'
}`
).replace(
  "const handleSwitchRole = (opt) => {\n    const idx = ROLE_OPTIONS.findIndex(r => r.role === opt.role)\n    switchRole({ ...opt, id: 'u' + (idx + 1) })\n  }",
  `const getRoleKey = (role) => {
    const roleMap = {
      '主播助理': 'assistant',
      '场控': 'controller',
      '售后组长': 'lead',
      'assistant': 'assistant',
      'controller': 'controller',
      'lead': 'lead'
    }
    return roleMap[role] || 'assistant'
  }

  const handleSwitchRole = (opt) => {
    const idx = ROLE_OPTIONS.findIndex(r => r.role === opt.role)
    switchRole({ ...opt, id: 'u' + (idx + 1) })
  }`
).replace(
  "{ROLE_OPTIONS.map((opt) => (\n            <button key={opt.role} className={`role-btn ${user?.role === opt.role ? 'active' : ''}`} onClick={() => handleSwitchRole(opt)}>",
  `{ROLE_OPTIONS.map((opt) => (
            <button key={opt.role} className={\`role-btn \${getRoleKey(user?.role) === opt.role ? 'active' : ''}\`} onClick={() => handleSwitchRole(opt)}>`
);
fs.writeFileSync('src/components/Header.jsx', fixedHeader, 'utf8');
console.log('Header.jsx 修复完成');

// 修复 CreateTicket.jsx - 添加角色映射兼容
const createTicketContent = fs.readFileSync('src/pages/CreateTicket.jsx', 'utf8');
const fixedCreateTicket = createTicketContent.replace(
  "const getRoleLabel = (role) => {\n    if (role === 'assistant') return '主播助理'\n    if (role === 'controller') return '场控'\n    if (role === 'lead') return '售后组长'\n    return role || '-'\n  }",
  `const getRoleLabel = (role) => {
    const roleMap = {
      'assistant': '主播助理',
      'controller': '场控',
      'lead': '售后组长',
      '主播助理': '主播助理',
      '场控': '场控',
      '售后组长': '售后组长'
    }
    return roleMap[role] || role || '-'
  }`
);
fs.writeFileSync('src/pages/CreateTicket.jsx', fixedCreateTicket, 'utf8');
console.log('CreateTicket.jsx 修复完成');

console.log('所有组件修复完成！');
