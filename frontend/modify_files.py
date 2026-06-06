#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def modify_borrow():
    print("修改 Borrow.vue...")
    with open('src/views/Borrow.vue', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 添加 useRoute 导入
    old_import = "import { ref, computed, onMounted, watch } from 'vue'"
    new_import = "import { ref, computed, onMounted, watch } from 'vue'\nimport { useRoute } from 'vue-router'"
    content = content.replace(old_import, new_import)
    
    # 2. 在 userStore 后面添加 route
    old_userstore = 'const userStore = useUserStore()'
    new_userstore = 'const route = useRoute()\nconst userStore = useUserStore()'
    content = content.replace(old_userstore, new_userstore)
    
    # 3. 在 availableKeys 后面添加 validTabs 和 setTabFromQuery 函数
    old_availablekeys = "const availableKeys = computed(() => keys.value.filter((k: Key) => k.status === 'available'))"
    new_availablekeys = """const availableKeys = computed(() => keys.value.filter((k: Key) => k.status === 'available'))

const validTabs = ['borrow', 'pending', 'history']

const setTabFromQuery = () => {
  const tab = route.query.tab as string
  if (tab && validTabs.includes(tab)) {
    activeTab.value = tab
  }
}"""
    content = content.replace(old_availablekeys, new_availablekeys)
    
    # 4. 在 onMounted 前面添加 watch，并在 onMounted 中调用 setTabFromQuery
    old_onmounted = """onMounted(() => {
  loadKeysAndStudents()
  loadPendingRecords()
  loadAllRecords()
})"""
    new_onmounted = """watch(
  () => route.query.tab,
  () => {
    setTabFromQuery()
  }
)

onMounted(() => {
  setTabFromQuery()
  loadKeysAndStudents()
  loadPendingRecords()
  loadAllRecords()
})"""
    content = content.replace(old_onmounted, new_onmounted)
    
    with open('src/views/Borrow.vue', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Borrow.vue 修改完成")


def modify_lost():
    print("修改 Lost.vue...")
    with open('src/views/Lost.vue', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 添加 useRoute 和 watch 导入
    old_import = "import { ref, computed, onMounted } from 'vue'"
    new_import = "import { ref, computed, onMounted, watch } from 'vue'\nimport { useRoute } from 'vue-router'"
    content = content.replace(old_import, new_import)
    
    # 2. 在 userStore 后面添加 route
    old_userstore = 'const userStore = useUserStore()'
    new_userstore = 'const route = useRoute()\nconst userStore = useUserStore()'
    content = content.replace(old_userstore, new_userstore)
    
    # 3. 在 availableKeys 后面添加 validTabs 和 setTabFromQuery 函数
    old_availablekeys = "const availableKeys = computed(() => keys.value.filter(k => k.status !== 'lost'))"
    new_availablekeys = """const availableKeys = computed(() => keys.value.filter(k => k.status !== 'lost'))

const validTabs = ['report', 'pending', 'history']

const setTabFromQuery = () => {
  const tab = route.query.tab as string
  if (tab && validTabs.includes(tab)) {
    activeTab.value = tab
  }
}"""
    content = content.replace(old_availablekeys, new_availablekeys)
    
    # 4. 在 onMounted 前面添加 watch，并在 onMounted 中调用 setTabFromQuery
    old_onmounted = """onMounted(() => {
  loadKeys()
  loadPendingRecords()
  loadAllRecords()
})"""
    new_onmounted = """watch(
  () => route.query.tab,
  () => {
    setTabFromQuery()
  }
)

onMounted(() => {
  setTabFromQuery()
  loadKeys()
  loadPendingRecords()
  loadAllRecords()
})"""
    content = content.replace(old_onmounted, new_onmounted)
    
    with open('src/views/Lost.vue', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Lost.vue 修改完成")


def modify_keys():
    print("修改 Keys.vue...")
    with open('src/views/Keys.vue', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 添加 useRoute 和 watch 导入
    old_import = "import { ref, computed, onMounted } from 'vue'"
    new_import = "import { ref, computed, onMounted, watch } from 'vue'\nimport { useRoute } from 'vue-router'"
    content = content.replace(old_import, new_import)
    
    # 2. 在 router 后面添加 route
    old_router = 'const router = useRouter()'
    new_router = 'const router = useRouter()\nconst route = useRoute()'
    content = content.replace(old_router, new_router)
    
    # 3. 在页面顶部添加提示条 - 在 filter-section 之前添加
    old_filter_section = '<div class="filter-section">'
    new_filter_section = """<div v-if="isOverdueView" class="overdue-alert">
        <el-alert
          title="当前显示：逾期风险视图 - 仅显示借出中的钥匙"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
      <div class="filter-section">"""
    content = content.replace(old_filter_section, new_filter_section)
    
    # 4. 添加 isOverdueView 计算属性和相关逻辑
    old_filters = 'const filters = ref({'
    new_filters = """const isOverdueView = computed(() => route.query.filter === 'overdue')

const applyFilterFromQuery = () => {
  if (route.query.filter === 'overdue') {
    filters.value.status = 'borrowed'
    loadKeys()
  }
}

const filters = ref({"""
    content = content.replace(old_filters, new_filters)
    
    # 5. 在 onMounted 前面添加 watch，并在 onMounted 中调用 applyFilterFromQuery
    old_onmounted = """onMounted(() => {
  loadKeys()
  loadStudents()
})"""
    new_onmounted = """watch(
  () => route.query.filter,
  () => {
    applyFilterFromQuery()
  }
)

onMounted(() => {
  applyFilterFromQuery()
  loadKeys()
  loadStudents()
})"""
    content = content.replace(old_onmounted, new_onmounted)
    
    # 6. 添加 overdue-alert 样式
    old_style = '<style scoped>'
    new_style = '''<style scoped>
.overdue-alert {
  margin-bottom: 20px;
}
'''
    content = content.replace(old_style, new_style)
    
    with open('src/views/Keys.vue', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Keys.vue 修改完成")


if __name__ == '__main__':
    modify_borrow()
    modify_lost()
    modify_keys()
    print("所有文件修改完成！")
