import requests

BASE_URL = 'http://localhost:8000/api'
r = requests.post(f'{BASE_URL}/auth/login', json={'username': 'zhangsan', 'password': '123456'})
token = r.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

r = requests.get(f'{BASE_URL}/exceptions', headers=headers, params={'page_size': 2})
data = r.json()
for item in data['items']:
    print(f"异常ID: {item['id']}, 标题: {item['title']}")
    if item.get('property_info'):
        pi = item['property_info']
        keys = list(pi.keys())
        print(f"  房源字段: {keys}")
        print(f"    状态: {pi.get('status')}")
        print(f"    责任人: {pi.get('handler_name')}")
        print(f"    更新时间: {pi.get('updated_at')}")
        print(f"    备注: {str(pi.get('remarks',''))[:40]}")
    if item.get('viewing_info'):
        vi = item['viewing_info']
        keys = list(vi.keys())
        print(f"  带看字段: {keys}")
        print(f"    状态: {vi.get('status')}")
        print(f"    责任人: {vi.get('handler_name')}")
        print(f"    更新时间: {vi.get('updated_at')}")
        print(f"    备注: {str(vi.get('remarks',''))[:40]}")
    print()
print('✅ 后端字段验证完成')
