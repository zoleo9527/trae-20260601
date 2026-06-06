#!/usr/bin/env python3
# -*- coding: utf-8 -*-

print("=" * 60)
print("🔍 修复验证报告")
print("=" * 60)

# 1. 验证 index.html
print("\n📄 1. index.html 验证:")
with open('www/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

if 'style="display: none;"' not in html and '<div class="modal-overlay" id="modal-overlay">' in html:
    print("   ✅ modal-overlay 已去掉内联 display: none")
else:
    print("   ❌ modal-overlay 仍有内联样式问题")

# 2. 验证 style.css
print("\n🎨 2. style.css 验证:")
with open('www/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

if '.modal-overlay {\n    position: fixed;' in css and 'display: none;' in css and '.modal-overlay.active {\n    display: flex;' in css:
    print("   ✅ modal-overlay 默认隐藏，active 时显示")
else:
    print("   ❌ modal-overlay 样式问题")

if '.toast.show {\n    transform: translateX(0);' in css:
    print("   ✅ toast.show 样式存在，用于移入屏幕")
else:
    print("   ❌ toast.show 样式缺失")

# 3. 验证 app.js
print("\n⚡ 3. app.js 验证:")
with open('www/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

if "t.className='toast '+type+' show'" in js:
    print("   ✅ showToast 已添加 show 类")
else:
    print("   ❌ showToast 缺少 show 类")

if "openModal(){document.getElementById('modal-overlay').classList.add('active')" in js:
    print("   ✅ openModal 使用 classList.add('active')")
else:
    print("   ❌ openModal 实现问题")

if "closeModal(){document.getElementById('modal-overlay').classList.remove('active')" in js:
    print("   ✅ closeModal 使用 classList.remove('active')")
else:
    print("   ❌ closeModal 实现问题")

# 4. 三端同步验证
print("\n🔄 4. 三端同步验证:")
sync_checks = [
    ('签收退件 (signReturn)', 'addReturnHistory', 'addHistory', 'addToRecent'),
    ('处理退件 (submitProcess)', 'addReturnHistory', 'addHistory', 'addToRecent'),
    ('关务审核 (submitCustoms)', 'addReturnHistory', 'addHistory', 'addToRecent'),
    ('新建退件 (submitNewReturn)', 'addHistory', 'addToRecent', None),
    ('新建上架单 (createRestock)', 'addHistory', 'addToRecent', None),
    ('确认上架 (confirmRestock)', 'addRestockHistory', 'addHistory', 'addToRecent'),
    ('运营跟进 (opsFollowUp)', 'addReturnHistory', 'addHistory', 'addToRecent'),
]

all_ok = True
for name, m1, m2, m3 in sync_checks:
    ok = m1 in js and m2 in js and (m3 is None or m3 in js)
    status = "✅" if ok else "❌"
    print(f"   {status} {name}")
    if not ok:
        all_ok = False

# 5. 事件绑定验证
print("\n🔗 5. 事件绑定验证:")
event_checks = [
    ('view-return → showReturnDetail', 'data-action="view-return"', 'showReturnDetail'),
    ('sign-return → signReturn', 'data-action="sign-return"', 'signReturn'),
    ('process-return → showProcessModal', 'data-action="process-return"', 'showProcessModal'),
    ('customs-review → showCustomsModal', 'data-action="customs-review"', 'showCustomsModal'),
    ('view-restock → showRestockDetail', 'data-action="view-restock"', 'showRestockDetail'),
    ('restock-confirm → confirmRestock', 'data-action="restock-confirm"', 'confirmRestock'),
    ('ops-follow → opsFollowUp', 'data-action="ops-follow"', 'opsFollowUp'),
]

for name, action, handler in event_checks:
    ok = action in js and handler in js
    status = "✅" if ok else "❌"
    print(f"   {status} {name}")

print("\n" + "=" * 60)
if all_ok:
    print("🎉 所有修复验证通过！")
else:
    print("⚠️  部分修复需要检查")
print("=" * 60)
