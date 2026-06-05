const http = require('http');

function api(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001' + path, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
  });
}

const ROLE_LABELS = { reception: '场馆前台', coach: '教练', manager: '值班店长' };
function getHandlerDisplay(c) {
  const roleLabel = ROLE_LABELS[c.currentHandlerRole] || c.currentHandlerRole;
  const name = c.currentHandlerName || '待分配';
  return roleLabel + ' · ' + name;
}

(async () => {
  const list = await api('/api/complaints');
  const todos = await api('/api/todos/manager');
  const c = list.find(x => x.complaintNo === 'TS-20260601-0003');
  const detail = await api('/api/complaints/' + c.id);
  const todo = todos.find(x => x.id === c.id);

  console.log('=== 三端显示一致性验证 ===');
  console.log('投诉单号:', c.complaintNo);
  console.log();
  console.log('列表页显示:', getHandlerDisplay(c));
  console.log('详情页显示:', getHandlerDisplay(detail));
  if (todo) console.log('待办卡片显示:', getHandlerDisplay(todo));
  console.log();
  console.log('列表与详情一致:', getHandlerDisplay(c) === getHandlerDisplay(detail));
  if (todo) console.log('列表与待办一致:', getHandlerDisplay(c) === getHandlerDisplay(todo));
  console.log();
  console.log('全部使用相同格式: 角色 · 姓名');
})();
