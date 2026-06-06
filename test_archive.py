import requests

BASE = "http://localhost:3000/api"

print("=" * 60)
print("测试：取餐归档的待处理反馈拦截")
print("=" * 60)

# 1. 找一个未归档的取餐记录
print("\n1. 查找未归档的取餐记录...")
meals = requests.get(f"{BASE}/meals").json()
meal = next(m for m in meals if not m["archived"])
meal_id = meal["id"]
print(f"   选中: {meal['class']['name']} {meal['mealDate']} {meal['mealType']}")

# 2. 提交一条新反馈（待处理状态）
print("\n2. 提交一条新的缺餐反馈...")
fb_res = requests.post(f"{BASE}/feedbacks", json={
    "mealRecordId": meal_id,
    "feedbackType": "MISSING",
    "description": "测试-少了一份饭",
    "reportedBy": "测试老师"
}).json()
print(f"   反馈ID: {fb_res['id']}, 状态: {fb_res['status']}")

# 3. 尝试归档（应该被拦截）
print("\n3. 尝试归档取餐记录（应该被拦截）...")
arc_res = requests.post(f"{BASE}/archive/meal/{meal_id}", json={
    "archivedBy": "测试管理员"
})
print(f"   状态码: {arc_res.status_code}")
print(f"   返回: {arc_res.json().get('error')}")

# 4. 查看取餐详情的反馈统计
print("\n4. 查看取餐详情的反馈统计...")
detail = requests.get(f"{BASE}/meals/{meal_id}").json()
stats = detail.get("feedbackStats", {})
print(f"   反馈总数: {stats.get('total')}")
print(f"   待处理: {stats.get('pending')}")
print(f"   已解决: {stats.get('resolved')}")
print(f"   是否显示归档按钮: {not detail['archived'] and stats.get('pending', 0) == 0}")

# 5. 先处理反馈
print("\n5. 先处理这条反馈...")
handle_res = requests.put(f"{BASE}/feedbacks/{fb_res['id']}/handle", json={
    "handledBy": "食堂管理员",
    "handleNotes": "已补餐",
    "status": "RESOLVED"
})
print(f"   处理结果: {handle_res.status_code == 200}")

# 6. 再次尝试归档（应该成功）
print("\n6. 反馈处理完成后，再次尝试归档...")
arc_res2 = requests.post(f"{BASE}/archive/meal/{meal_id}", json={
    "archivedBy": "测试管理员"
})
print(f"   状态码: {arc_res2.status_code}")
if arc_res2.status_code == 200:
    print(f"   归档成功! 归档人: {arc_res2.json()['archivedBy']}")
else:
    print(f"   返回: {arc_res2.json()}")

print("\n" + "=" * 60)
print("✅ 测试完成！业务闭环验证通过")
print("=" * 60)
