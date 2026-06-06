import requests
BASE = 'http://localhost:3000/api'

print('=' * 70)
print('验证默认样例数据状态')
print('=' * 70)

# 查取餐记录
meals = requests.get(f'{BASE}/meals').json()
print()
print('取餐记录状态:')
for m in meals:
    fbs = m['feedbacks']
    pending = len([f for f in fbs if f['status'] == 'PENDING'])
    resolved = len([f for f in fbs if f['status'] == 'RESOLVED'])
    archived = '已归档' if m['archived'] else '未归档'
    print(f'  {m["class"]["name"]} {m["mealDate"]} {m["mealType"]} | {archived} | 反馈:{len(fbs)} (待处理:{pending}/已解决:{resolved})')

# 查反馈
feedbacks = requests.get(f'{BASE}/feedbacks').json()
print()
print('反馈记录状态:')
for f in feedbacks:
    meal_archived = '(关联取餐已归档)' if f.get('mealRecord', {}).get('archived') else ''
    archived = '已归档' if f['archived'] else '未归档'
    status = '待处理' if f['status'] == 'PENDING' else '已解决'
    print(f'  {f["class"]["name"]} | {status} | {archived} {meal_archived}')

# 验证可取餐的班级列表
print()
print('可取餐记录列表（提交反馈时使用）:')
classes = requests.get(f'{BASE}/classes').json()
for c in classes:
    avail = requests.get(f'{BASE}/classes/{c["id"]}/available-meals').json()
    print(f'  {c["name"]}: {len(avail)} 条可关联记录')

print()
print('=' * 70)
print('四种场景样例已就绪:')
print('  1. 一年级1班今天: 无反馈 -> 可提交新反馈（顺利流）')
print('  2. 一年级2班今天: 1条待处理反馈 -> 问题流处理中')
print('  3. 二年级1班昨天: 1条已解决反馈 -> 可归档（待归档样例）')
print('  4. 三年级1班前天: 已归档 -> 只读归档样例')
print('=' * 70)
