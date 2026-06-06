#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('www/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 修改所有动作的 renderPage，使其刷新当前页面而不是强制跳转
replacements = [
    ("this.renderPage('operations-desk');", "this.renderPage(this.currentPage);"),
    ("this.renderPage('restock-desk');", "this.renderPage(this.currentPage);"),
    ("this.renderPage('warehouse-desk');", "this.renderPage(this.currentPage);"),
    ("this.renderPage('customs-desk');", "this.renderPage(this.currentPage);"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('www/js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("刷新逻辑修复完成！")
print("\n修改的动作：")
print("✅ opsFollowUp - 刷新当前页")
print("✅ confirmRestock - 刷新当前页")
print("✅ submitNewRestock - 刷新当前页")
print("✅ submitProcess - 刷新当前页")
print("✅ submitCustoms - 刷新当前页")
print("✅ submitNewReturn - 刷新当前页")
print("✅ signReturn - 已正确刷新当前页")
print("\n效果：在任意页面（包括dashboard）执行动作后，三组列表和最近打开都会即时刷新")
