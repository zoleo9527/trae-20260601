const http = require('http');
const BASE = 'http://127.0.0.1:3000';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: '127.0.0.1', port: 3000, path, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (b) opts.headers['Content-Length'] = Buffer.byteLength(b);
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    r.on('error', reject);
    if (b) r.write(b);
    r.end();
  });
}

async function main() {
  const login = await req('POST', '/auth/login', { username: 'manager', password: '123456' });
  const token = login.data.accessToken;
  const users = await req('GET', '/auth/users', null, token);
  const designer = users.data.find(u => u.role === 'designer');
  const installer = users.data.find(u => u.role === 'installer');
  console.log('designer:', designer?.name, 'installer:', installer?.name);

  const order = await req('POST', '/print-orders', { projectName: 'debug', customerName: 'c', customerPhone: '1', contentDescription: 't' }, token);
  const oid = order.data.id;
  console.log('orderId:', oid);

  await req('POST', `/print-orders/${oid}/assign-designer`, { designerId: designer.id }, token);
  await req('POST', `/print-orders/${oid}/submit-design`, { designFileUrl: 'http://a.com' }, token);
  await req('POST', `/print-orders/${oid}/start-print`, {}, token);
  await req('POST', `/print-orders/${oid}/complete-print`, {}, token);
  await req('POST', `/print-orders/${oid}/assign-installation`, { installLeaderId: installer.id, scheduledDate: '2026-06-20' }, token);

  const login2 = await req('POST', '/auth/login', { username: 'installer', password: '123456' });
  const token2 = login2.data.accessToken;
  await req('POST', `/print-orders/${oid}/start-installation`, {}, token2);

  const cur = await req('GET', `/print-orders/${oid}`, null, token);
  console.log('before photo-return, status:', cur.data.status);

  const pr = await req('POST', `/print-orders/${oid}/photo-return`, { photoUrls: ['http://1.jpg', 'http://2.jpg'], returnNotes: 'test' }, token2);
  console.log('photo-return response keys:', Object.keys(pr.data || {}));
  console.log('photo-return response:', JSON.stringify(pr).slice(0, 400));

  const cur2 = await req('GET', `/print-orders/${oid}`, null, token);
  console.log('after photo-return, status:', cur2.data.status);

  const prId = pr.data?.id || pr.data?.photoReturn?.id;
  console.log('extracted photoReturnId:', prId);

  if (prId) {
    const rej = await req('POST', `/print-orders/${oid}/photo-return/${prId}/reject`, { rejectReason: 'bad quality', reviewNotes: 'redo' }, token);
    console.log('reject result:', JSON.stringify(rej).slice(0, 400));
  } else {
    console.log('NO photoReturnId found, trying to find in response data...');
    console.log('full response:', JSON.stringify(pr));
  }
}

main().catch(console.error);
