import http from 'http';

function makeRequest(options, data = null) {
	return new Promise((resolve, reject) => {
		const req = http.request({ ...options, hostname: '127.0.0.1', port: 5176 }, (res) => {
			let body = '';
			res.on('data', chunk => body += chunk);
			res.on('end', () => {
				try {
					resolve({ status: res.statusCode, body: JSON.parse(body), headers: res.headers });
				} catch (e) {
					resolve({ status: res.statusCode, body, headers: res.headers });
				}
			});
		});
		req.on('error', reject);
		if (data) req.write(data);
		req.end();
	});
}

async function test() {
	const cookieJar = {};

	console.log('=== 1. 登录 roaster_zhang ===');
	let loginRes = await makeRequest({
		hostname: 'localhost',
		port: 5175,
		path: '/api/auth/login',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	}, JSON.stringify({ username: 'roaster_zhang', password: '123456' }));
	console.log('登录:', loginRes.status, loginRes.body);
	const cookies = loginRes.headers['set-cookie'];
	const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

	console.log('\n=== 2. 尝试直接把计划 2 (planned) 改为 completed (应该失败) ===');
	let res1 = await makeRequest({
		hostname: 'localhost',
		port: 5175,
		path: '/api/roasting-plans/2/status',
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader }
	}, JSON.stringify({ status: 'completed' }));
	console.log('结果:', res1.status, res1.body);

	console.log('\n=== 3. 先把计划 2 改为 approved (应该成功) ===');
	let res2 = await makeRequest({
		hostname: 'localhost',
		port: 5175,
		path: '/api/roasting-plans/2/status',
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader }
	}, JSON.stringify({ status: 'approved' }));
	console.log('结果:', res2.status, res2.body);

	console.log('\n=== 4. 尝试把 approved 改为 completed (应该失败：状态流转不允许) ===');
	let res3 = await makeRequest({
		hostname: 'localhost',
		port: 5175,
		path: '/api/roasting-plans/2/status',
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader }
	}, JSON.stringify({ status: 'completed' }));
	console.log('结果:', res3.status, res3.body);

	console.log('\n=== 5. 登录 cupper_li，尝试审批计划 ===');
	let loginRes2 = await makeRequest({
		hostname: 'localhost',
		port: 5175,
		path: '/api/auth/login',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	}, JSON.stringify({ username: 'cupper_li', password: '123456' }));
	console.log('登录:', loginRes2.status, loginRes2.body);
	const cookies2 = loginRes2.headers['set-cookie'];
	const cookieHeader2 = cookies2.map(c => c.split(';')[0]).join('; ');

	let res4 = await makeRequest({
		hostname: 'localhost',
		port: 5175,
		path: '/api/roasting-plans/3/status',
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader2 }
	}, JSON.stringify({ status: 'approved' }));
	console.log('杯测员审批结果:', res4.status, res4.body);
}

test().catch(console.error);
