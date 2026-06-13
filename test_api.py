#!/usr/bin/env python3
import json
import urllib.request

BASE = 'http://localhost:3001/api'

def get(path):
    with urllib.request.urlopen(BASE + path) as resp:
        return json.loads(resp.read())

print('=' * 60)
print('异常提醒 - 接口验证')
print('=' * 60)

print('\n1. 待处理状态（open + processing）')
d = get('/exceptions?status=open,processing')
print(f'   总数: {d["total"]} (预期 4)')
for item in d['list']:
    print(f'   - {item["customer_name"]}: {item["type"]} / {item["status"]}')

print('\n2. 催收类型（urge）')
d = get('/exceptions?type=urge')
print(f'   总数: {d["total"]} (预期 2)')
for item in d['list']:
    print(f'   - {item["customer_name"]}: {item["title"]}')

print('\n3. 退回类型（reject）')
d = get('/exceptions?type=reject')
print(f'   总数: {d["total"]} (预期 2)')
for item in d['list']:
    print(f'   - {item["customer_name"]}: {item["title"]}')

print('\n4. 补材料类型（supplement）')
d = get('/exceptions?type=supplement')
print(f'   总数: {d["total"]} (预期 2)')
for item in d['list']:
    print(f'   - {item["customer_name"]}: {item["title"]}')

print('\n5. 关键字搜索（银行）')
d = get('/exceptions?keyword=银行')
print(f'   匹配数: {d["total"]}')
for item in d['list']:
    print(f'   - {item["customer_name"]}: {item["title"]}')

print('\n6. 已解决状态（resolved）')
d = get('/exceptions?status=resolved')
print(f'   总数: {d["total"]}')

print('\n7. 已关闭状态（closed）')
d = get('/exceptions?status=closed')
print(f'   总数: {d["total"]}')

print('\n' + '=' * 60)
print('税期申报 - 接口验证')
print('=' * 60)

print('\n1. 待处理+处理中（pending + in_progress）')
d = get('/tax-filings?status=pending,in_progress')
print(f'   总数: {d["total"]} (预期 8)')

print('\n2. 关键字搜索（建材）')
d = get('/tax-filings?keyword=建材')
print(f'   匹配数: {d["total"]}')
for item in d['list']:
    print(f'   - {item["customer_name"]} {item["period"]} {item["status"]}')

print('\n3. 已退回状态（rejected）')
d = get('/tax-filings?status=rejected')
print(f'   总数: {d["total"]} (预期 1)')

print('\n' + '=' * 60)
print('验证完成')
print('=' * 60)
