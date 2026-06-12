const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve({ raw: body, statusCode: res.statusCode }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Login
  const loginData = JSON.stringify({ username: 'consultant', password: '123456' });
  const loginRes = await request({
    hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, loginData);
  
  const token = loginRes.token;
  console.log('Token obtained:', token ? 'OK' : 'FAIL');
  
  // Get properties
  const props = await request({
    hostname: 'localhost', port: 3001, path: '/api/properties',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  const vacant = props.find(p => p.status === 'vacant');
  console.log('Vacant property:', vacant ? vacant.id : 'NONE');
  
  if (!vacant) {
    console.log('No vacant property available');
    return;
  }
  
  // Create viewing
  const viewingData = JSON.stringify({
    propertyId: vacant.id,
    customerName: '测试客户',
    customerPhone: '13800138000',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
  });
  
  console.log('Creating viewing for property:', vacant.id);
  const viewing = await request({
    hostname: 'localhost', port: 3001, path: '/api/viewings', method: 'POST',
    headers: { 
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Content-Length': viewingData.length
    }
  }, viewingData);
  
  console.log('Viewing result:', JSON.stringify(viewing, null, 2).substring(0, 500));
  
  // Check property status
  const updatedProp = await request({
    hostname: 'localhost', port: 3001, path: '/api/properties/' + vacant.id,
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  console.log('Property status after viewing:', updatedProp.status);
  console.log('Status match:', updatedProp.status === 'viewing_scheduled' ? 'PASS ✓' : 'FAIL ✗');
}

main().catch(console.error);
