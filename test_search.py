import json, urllib.request, urllib.parse

BASE = 'http://localhost:3001/api'

def login(name, pwd='123456'):
    req = urllib.request.Request(
        f'{BASE}/auth/login',
        data=json.dumps({'name': name, 'password': pwd}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    res = urllib.request.urlopen(req).read()
    return json.loads(res)['token']

def get(path, token, params=None):
    url = f'{BASE}{path}'
    if params:
        url += '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    return json.loads(urllib.request.urlopen(req).read())

def print_batches(title, data):
    print(f'\n=== {title} ===')
    print(f'  total: {data["total"]}')
    for b in data['batches']:
        print(f'    {b["batch_code"]}  {b["patient_name"]:6s}  {b["status"]:10s}')

def print_labels(title, data):
    print(f'\n=== {title} ===')
    print(f'  total: {data["total"]}')
    for l in data['labels']:
        print(f'    {l["label_code"]:20s}  {l["batch_code"]}  {l["patient_name"]:6s}  {l["status"]:10s}')

# ========== 测试 ==========
w_token = login('孙煎药员')
d_token = login('周客服')

# 批次搜索测试
print_batches('测试1: 批次仅 keyword=张伟', get('/batches', w_token, {'keyword': '张伟'}))
print_batches('测试2: 批次 keyword=张伟 + status=completed', get('/batches', w_token, {'keyword': '张伟', 'status': 'completed'}))
print_batches('测试3: 批次 keyword=张伟 + status=pending(应无结果)', get('/batches', w_token, {'keyword': '张伟', 'status': 'pending'}))

# 贴标搜索测试
print_labels('测试4: 贴标仅 keyword=BATCH202606040001', get('/labels', d_token, {'keyword': 'BATCH202606040001'}))
print_labels('测试5: 贴标 keyword=BATCH202606040001 + status=delivered', get('/labels', d_token, {'keyword': 'BATCH202606040001', 'status': 'delivered'}))
print_labels('测试6: 贴标 keyword=王芳(患者名)', get('/labels', d_token, {'keyword': '王芳'}))
print_labels('测试7: 贴标 keyword=BATCH202606040001 + status=pending(应无结果)', get('/labels', d_token, {'keyword': 'BATCH202606040001', 'status': 'pending'}))

print('\n✓ 所有测试完成')
