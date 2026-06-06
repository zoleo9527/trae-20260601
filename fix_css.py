#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('www/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 modal-overlay：默认隐藏，active 时显示
old_modal = """.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}"""

new_modal = """.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-overlay.active {
    display: flex;
}"""

content = content.replace(old_modal, new_modal)

# 确保 toast 样式正确（我们会在 JS 中加 show 类，CSS 已经有了，但我们再确认）
# CSS 中已经有 .toast.show { transform: translateX(0); } 所以不用改 CSS

with open('www/css/style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("style.css fixed successfully")
