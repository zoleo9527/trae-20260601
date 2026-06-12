const http = require('http');

function post(path, token, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(options, res => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        console.log(`  POST ${path} → ${res.statusCode}`);
        console.log(`  Response: ${responseBody.substring(0, 300)}`);
        try { resolve(JSON.parse(responseBody)); }
        catch(e) { resolve({ statusCode: res.statusCode, body: responseBody }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost', port: 3001, path,
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve(body); }
      });
    }).on('error', reject);
  });
}

async function main() {
  // Login
  const loginRes = await post('/api/auth/login', '', { username: 'consultant', password: '123456' });
  const token = loginRes.token;
  if (!token) { console.log('Login failed:', loginRes); return; }
  console.log('✓ Login OK');

  // Get properties
  const props = await get('/api/properties', token);
  const vacant = props.find(p => p.status === 'vacant');
  if (!vacant) { console.log('No vacant property'); return; }
  console.log('✓ Vacant property:', vacant.id, vacant.building);

  // Create viewing with all required fields
  const viewing = await post('/api/viewings', token, {
    propertyId: vacant.id,
    customerName: '测试客户',
    customerPhone: '13800138000',
    companyName: '测试公司',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    needs: '需要办公室'
  });

  if (viewing.id) {
    console.log('✓ Viewing created:', viewing.id);
    
    const updatedProp = await get('/api/properties/' + vacant.id, token);
    console.log('✓ Property status:', updatedProp.status);
    console.log('  Status match:', updatedProp.status === 'viewing_scheduled' ? 'PASS ✓' : 'FAIL ✗');
  }
}

main().catch(console.error);
