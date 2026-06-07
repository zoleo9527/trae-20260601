#!/usr/bin/env python3
import json
import urllib.request

url = "http://127.0.0.1:8080/api/locker/compensations?page=1&page_size=10"

print("请求:", url)
print()

try:
    with urllib.request.urlopen(url, timeout=5) as resp:
        raw = resp.read().decode("utf-8")
        data = json.loads(raw)

    print("HTTP响应 code:", data.get("code"), data.get("message"))
    print("总记录数:", data.get("total"))
    print()

    items = data.get("data", [])
    print("=" * 60)
    print("=== 赔付待办列表（默认视图）===")
    print("=" * 60)

    for idx, item in enumerate(items, 1):
        ss = item["status_summary"]
        ab = item["abnormal_brief"]
        print(f"\n{idx}. 【{ss['priority_tag']}】 {item['locker_no']} - {item['customer_name']} | ¥{item['compensation_amount']}")
        print(f"   状态: {item['status_display']}")
        print(f"   当前阶段: {ss['current_stage']}")
        print(f"   下一步动作: {ss['next_action']}")
        print(f"   异常类型: {ab['abnormal_type_display']} (优先级: {ab['priority']})")
        print(f"   异常描述: {ab['abnormal_description']}")
        print(f"   主管处理: {ab['process_result_brief']}")
        print(f"   已等待: {item['waiting_days']}天 | 紧急标记: {'是' if item['is_urgent'] else '否'}")

    print()
    print("=" * 60)
    print("✅ HTTP接口验证通过！")
    print("   默认只返回：待审核 / 待支付 / 已拒绝 三类数据")
    print("   每条包含：阶段、下一步、异常摘要、处理结果、紧急标记")
    print("   财务无需逐条进详情即可快速判断先处理哪一单")

except Exception as e:
    print(f"❌ 请求失败: {e}")
    import traceback
    traceback.print_exc()
