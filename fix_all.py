#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('www/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修复 getReturns 筛选：todayDue 和 delayed 排除已完成的退件
old_getReturns = "  getReturns(f={}){let r=[...this.returns];if(f.status)r=r.filter(x=>x.status===f.status);if(f.handler)r=r.filter(x=>x.currentHandler===f.handler);if(f.delayed)r=r.filter(x=>x.isDelayed);if(f.newReturn)r=r.filter(x=>x.isNewReturn);if(f.todayDue)r=r.filter(x=>x.dueDate===fmtDate(today));return r;},"

new_getReturns = "  getReturns(f={}){let r=[...this.returns];if(f.status)r=r.filter(x=>x.status===f.status);if(f.handler)r=r.filter(x=>x.currentHandler===f.handler);if(f.delayed)r=r.filter(x=>x.isDelayed&&x.status!=='completed');if(f.newReturn)r=r.filter(x=>x.isNewReturn);if(f.todayDue)r=r.filter(x=>x.dueDate===fmtDate(today)&&x.status!=='completed');if(f.excludeCompleted)r=r.filter(x=>x.status!=='completed');return r;},"

content = content.replace(old_getReturns, new_getReturns)

# 2. 确保 renderDashboard 中的筛选也排除已完成（虽然 getReturns 已经处理了，但我们也可以在调用时确认）
# 这里已经通过 getReturns 修复了，所以不需要额外修改

# 3. 让我们也检查一下数据模拟部分，确保有足够的测试数据
# 检查 today = new Date('2026-06-06')，而退件的 dueDate 是否有对应值
# 数据中应该有：
# RT20260606001: dueDate: fmtDate(today) = '2026-06-06', isDelayed: false, isNewReturn: true, status: 'pending'
# RT20260606002: dueDate: fmtDate(addDays(today,-1)) = '2026-06-05', isDelayed: true, status: 'processing'
# RT20260606003: dueDate: fmtDate(today) = '2026-06-06', isDelayed: false, status: 'processing'
# RT20260606004: dueDate: fmtDate(addDays(today,-2)) = '2026-06-04', isDelayed: true, status: 'processing'
# RT20260606005: dueDate: fmtDate(today) = '2026-06-06', isDelayed: false, status: 'pending'

# 所以 todayReturns 应该包含：RT20260606001, RT20260606003, RT20260606005（3条）
# delayedReturns 应该包含：RT20260606002, RT20260606004（2条）
# newReturns 应该包含：RT20260606001（1条）

with open('www/js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("修复完成！")
print("\n修复内容：")
print("✅ 1. getReturns 筛选逻辑修复：")
print("   - todayDue: 排除已完成的退件")
print("   - delayed: 排除已完成的退件")
print("   - 新增 excludeCompleted 参数供灵活使用")
print("\n预期数据：")
print("   - 今天要办：3条（RT20260606001, 003, 005）")
print("   - 已经拖延：2条（RT20260606002, 004）")
print("   - 刚刚被退回：1条（RT20260606001）")
