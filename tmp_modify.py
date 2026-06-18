import re

file_path = "src/components/verification/VerificationDetail.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. 修改关联客诉标题栏，添加已有客诉时的提示文字
old_title = """                <MessageSquarePlus className="w-4 h-4 text-flame-600" />
                关联客诉
              </div>"""

new_title = """                <MessageSquarePlus className="w-4 h-4 text-flame-600" />
                关联客诉
                {complaint && (
                  <span className="text-xs text-flame-600 font-normal">已关联客诉，点击查看详情</span>
                )}
              </div>"""

content = content.replace(old_title, new_title)

# 2. 修改关联客诉卡片，添加左边框强调
old_card = """className="flex items-center gap-4 p-4 rounded-xl bg-ink-50 hover:bg-ink-100 transition-colors border border-ink-200" """

new_card = """className="flex items-center gap-4 p-4 rounded-xl bg-ink-50 hover:bg-ink-100 transition-colors border border-ink-200 border-l-4 border-l-flame-500" """

content = content.replace(old_card, new_card)

# 3. 修改无客诉时的提示文案
old_hint = """              <div className="text-center py-8 text-ink-400 text-sm">
                该核销单暂无关联客诉
              </div>"""

new_hint = """              <div className="text-center py-8 text-ink-400 text-sm">
                该核销单暂无客诉，如客户有投诉可点击右上角发起
              </div>"""

content = content.replace(old_hint, new_hint)

# 4. 修改右侧快捷操作区域按钮
old_action = """              <ActionButton variant="primary" icon={<MessageSquarePlus className="w-4 h-4" />} onClick={handleOpenModal}>
                发起客诉
              </ActionButton>"""

new_action = """              {complaint ? (
                <ActionButton
                  variant="secondary"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                >
                  查看客诉详情
                </ActionButton>
              ) : (
                <ActionButton variant="primary" icon={<MessageSquarePlus className="w-4 h-4" />} onClick={handleOpenModal}>
                  发起客诉
                </ActionButton>
              )}"""

content = content.replace(old_action, new_action)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("修改完成！")
