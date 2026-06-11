<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <el-button :icon="ArrowLeft" link @click="goBack">
          返回列表
        </el-button>
        <h2 class="page-title" style="display: inline-block; margin-left: 12px;">
          签到详情
        </h2>
      </div>
      <el-tag :type="getCheckinStatusType(checkIn?.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN')" size="large">
        {{ getCheckinStatusLabel(checkIn?.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN') }}
      </el-tag>
    </div>

    <div v-loading="loading" class="detail-card">
      <div class="detail-section">
        <div class="detail-section-title">基本信息</div>
        <el-row :gutter="24">
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">签到ID：</span>
              <span class="info-value">{{ checkIn?.id || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">项目名称：</span>
              <span class="info-value">
                <el-link type="primary" @click="goToPlan">
                  {{ checkIn?.projectName || '-' }}
                </el-link>
              </span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">技师：</span>
              <span class="info-value">{{ checkIn?.technicianName || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">电梯编号：</span>
              <span class="info-value">{{ checkIn?.elevatorNo || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="16">
            <div class="info-row">
              <span class="info-label">电梯位置：</span>
              <span class="info-value">{{ checkIn?.projectName || '-' }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">签到信息</div>
        <el-row :gutter="24">
          <el-col :span="12">
            <div class="info-row">
              <span class="info-label">签到时间：</span>
              <span class="info-value">{{ formatDateTime(checkIn?.checkInTime) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-row">
              <span class="info-label">签退时间：</span>
              <span class="info-value">{{ checkIn?.checkOutTime ? formatDateTime(checkIn?.checkOutTime) : '-' }}</span>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="info-row">
              <span class="info-label">签到位置：</span>
              <span class="info-value">{{ checkIn?.locationRemark || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-row">
              <span class="info-label">纬度：</span>
              <span class="info-value">{{ checkIn?.latitude || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-row">
              <span class="info-label">经度：</span>
              <span class="info-value">{{ checkIn?.longitude || '-' }}</span>
            </div>
          </el-col>
        </div>
      </div>

      <div class="detail-section" v-if="checkIn?.checkOutTime">
        <div class="detail-section-title">签退信息</div>
        <el-row :gutter="24">
          <el-col :span="8">
            <div class="info-row">
              <span class="info-label">工作结果：</span>
              <span class="info-value">
                <el-tag v-if="checkIn?.workResult" :type="getWorkResultType(checkIn.workResult)">
                  {{ getWorkResultLabel(checkIn.workResult) }}
                </el-tag>
                <span v-else>-</span>
              </span>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="info-row">
              <span class="info-label">工作内容：</span>
              <span class="info-value">{{ checkIn?.workContent || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="24" v-if="checkIn?.problemDesc">
            <div class="info-row">
              <span class="info-label">问题描述：</span>
              <span class="info-value">{{ checkIn.problemDesc }}</span>
            </div>
          </el-col>
          <el-col :span="24" v-if="checkIn?.solution">
            <div class="info-row">
              <span class="info-label">处理方案：</span>
              <span class="info-value">{{ checkIn.solution }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="detail-section" v-if="checkIn?.checkInPhotos && checkIn.checkInPhotos.length > 0">
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
      </div>

      <div class="detail-section" v-if="checkIn?.note">
        <div class="detail-section-title">备注</div>
        <div style="color: #606266; line-height: 1.6;">
          {{ checkIn.note }}
        </div>
      </div>

      <div class="action-bar">
        <el-button :icon="ArrowLeft" @click="goBack">
          返回
        </el-button>
        <el-button
          v-if="checkIn?.planId"
          type="primary"
          :icon="Document"
          @click="goToPlan"
        >
          查看计划
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Document } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getCheckInById } from '@/api/checkin'
import {
  getCheckinStatusLabel,
  getCheckinStatusType,
  getWorkResultLabel,
  getWorkResultType
} from '@/utils/constants'

const route = useRoute()
const router = useRouter()

const checkInId = computed(() => route.params.id)

const loading = ref(false)
const checkIn = ref(null)

const formatDateTime = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const loadData = async () => {
  loading.value = true
  try {
    checkIn.value = await getCheckInById(checkInId.value)
  } catch (e) {
    console.error('Load checkin detail error:', e)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/checkins')
}

const goToPlan = () => {
  if (checkIn.value?.planId) {
    router.push(`/plans/${checkIn.value.planId}`)
  }
}

const previewImage = (url) => {
  window.open(url, '_blank')
}

onMounted(() => {
  loadData()
})
</script>
