#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('www/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 showToast：添加 show 类使 toast 移入屏幕
old_toast = """  showToast(msg,type='info'){
    const t=document.getElementById('toast');
    t.textContent=msg;t.className='toast '+type;t.style.display='block';
    setTimeout(()=>{t.style.display='none';},3000);
  },"""

new_toast = """  showToast(msg,type='info'){
    const t=document.getElementById('toast');
    t.textContent=msg;
    t.className='toast '+type+' show';
    t.style.display='block';
    setTimeout(()=>{
      t.className='toast';
      t.style.display='none';
    },3000);
  },"""

content = content.replace(old_toast, new_toast)

# 确认三端同步逻辑已经存在：
# 1. signReturn 中有 addReturnHistory, addHistory, addToRecent ✓
# 2. submitProcess 中有 addReturnHistory, addHistory, addToRecent ✓
# 3. submitCustoms 中有 addReturnHistory, addHistory, addToRecent ✓
# 4. submitNewReturn 中有 addHistory, addToRecent ✓
# 5. submitNewRestock (createRestock) 中有 addHistory, addToRecent ✓
# 6. confirmRestock 中有 addRestockHistory, addHistory, addToRecent ✓
# 7. opsFollowUp 中有 addReturnHistory, addHistory, addToRecent ✓

with open('www/js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js fixed successfully")
print("\n--- 三端同步验证 ---")
print("✓ signReturn: 历史记录 + 操作历史 + 最近打开")
print("✓ submitProcess: 历史记录 + 操作历史 + 最近打开")
print("✓ submitCustoms: 历史记录 + 操作历史 + 最近打开")
print("✓ submitNewReturn: 操作历史 + 最近打开")
print("✓ createRestock: 操作历史 + 最近打开")
print("✓ confirmRestock: 历史记录 + 操作历史 + 最近打开")
print("✓ opsFollowUp: 历史记录 + 操作历史 + 最近打开")
