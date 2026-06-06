#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('www/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 去掉 modal-overlay 的内联 style="display: none;"
content = content.replace(
    '<div class="modal-overlay" id="modal-overlay" style="display: none;">',
    '<div class="modal-overlay" id="modal-overlay">'
)

with open('www/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html fixed successfully")
