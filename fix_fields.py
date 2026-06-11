#!/usr/bin/env python3
import re

BASE_DIR = "/Users/zhangliu/Documents/private/model-test/trae-20260601-10/elevator-maintenance-web/src/views"

def fix_plan_list():
    filepath = f"{BASE_DIR}/PlanList.vue"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    old = """    await dispatchPlan(currentPlan.value.id, {
      technicianId: dispatchForm.technicianId,
      note: dispatchForm.note
    })"""

    new = """    await dispatchPlan({
      planId: currentPlan.value.id,
      technicianId: dispatchForm.technicianId,
      dispatcherId: userStore.user.id,
      remark: dispatchForm.note
    })"""

    if old in content:
        content = content.replace(old, new)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("✅ PlanList.vue 派单调用签名已修复")
    else:
        print("⚠️ PlanList.vue 未找到需要替换的内容，可能已经修复")

def fix_plan_detail():
    filepath = f"{BASE_DIR}/PlanDetail.vue"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 修复导入
    old_import = "import { checkIn, checkOut, getActiveCheckIn } from '@/api/checkin'"
    new_import = "import { getCheckInRecords, checkIn, checkOut, getActiveCheckIn } from '@/api/checkin'"

    if old_import in content:
        content = content.replace(old_import, new_import)
        print("✅ PlanDetail.vue 导入 getCheckInRecords 已添加")
    elif new_import in content:
        print("⚠️ PlanDetail.vue getCheckInRecords 已经导入")
    else:
        print("⚠️ PlanDetail.vue 未找到 checkin 导入语句，需要手动检查")

    # 修复 loadData
    old_load = """    const [planRes, notesRes, checkInRes] = await Promise.all([
      getPlanById(planId.value),
      getPlanNotes(planId.value),
      getActiveCheckIn(planId.value).catch(() => null)
    ])
    plan.value = planRes
    notes.value = notesRes || []
    activeCheckIn.value = checkInRes || null

    if (notes.value && notes.value.length > 0) {
      notes.value.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    }"""

    new_load = """    const [planRes, notesRes, checkInRes, allCheckInRes] = await Promise.all([
      getPlanById(planId.value),
      getPlanNotes(planId.value),
      getActiveCheckIn(planId.value).catch(() => null),
      getCheckInRecords({ planId: planId.value }).catch(() => [])
    ])
    plan.value = planRes
    notes.value = notesRes || []
    activeCheckIn.value = checkInRes || null
    checkInRecords.value = allCheckInRes || []

    if (notes.value && notes.value.length > 0) {
      notes.value.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    }

    if (checkInRecords.value && checkInRecords.value.length > 0) {
      checkInRecords.value.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
    }"""

    if old_load in content:
        content = content.replace(old_load, new_load)
        print("✅ PlanDetail.vue loadData 加载历史签到记录已修复")
    elif "getCheckInRecords" in content:
        print("⚠️ PlanDetail.vue loadData 可能已经修复")
    else:
        print("⚠️ PlanDetail.vue 未找到需要替换的 loadData 内容")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

def fix_checkin_detail():
    filepath = f"{BASE_DIR}/CheckInDetail.vue"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    old_photos = """      <div class="detail-section" v-if="checkIn?.checkInPhotos && checkIn.checkInPhotos.length > 0">
        <div class="detail-section-title">签到照片</div>
        <div class="photo-grid">
          <div
            v-for="(photo, index) in checkIn.checkInPhotos"
            :key="index"
            class="photo-item"
          >
            <img :src="photo" alt="签到照片" @click="previewImage(photo)" />
          </div>
        </div>
      </div>

      <div class="detail-section" v-if="checkIn?.checkOutPhotos && checkIn.checkOutPhotos.length > 0">
        <div class="detail-section-title">签退照片</div>
        <div class="photo-grid">
          <div
            v-for="(photo, index) in checkIn.checkOutPhotos"
            :key="index"
            class="photo-item"
          >
            <img :src="photo" alt="签退照片" @click="previewImage(photo)" />
          </div>
        </div>
      </div>"""

    new_photos = """      <div class="detail-section" v-if="checkIn?.photoData">
        <div class="detail-section-title">签到照片</div>
        <div class="photo-grid">
          <div class="photo-item">
            <img :src="checkIn.photoData" alt="签到照片" @click="previewImage(checkIn.photoData)" />
          </div>
        </div>
      </div>"""

    if old_photos in content:
        content = content.replace(old_photos, new_photos)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("✅ CheckInDetail.vue 照片绑定字段已修复")
    elif "checkIn?.photoData" in content:
        print("⚠️ CheckInDetail.vue 照片绑定可能已经修复")
    else:
        print("⚠️ CheckInDetail.vue 未找到需要替换的照片内容")

if __name__ == "__main__":
    print("开始修复前端项目问题...\n")
    fix_plan_list()
    fix_plan_detail()
    fix_checkin_detail()
    print("\n修复完成！")
