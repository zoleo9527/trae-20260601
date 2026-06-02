<template>
  <div class="container">
    <div class="dashboard-grid">
      <div class="stats-card">
        <div class="label">摊位总数</div>
        <div class="value">{{ dashboard.stallCount || 0 }}</div>
        <div style="font-size: 12px; color: #909399; margin-top: 4px;">
          营业中 {{ dashboard.activeStallCount || 0 }} 个
        </div>
      </div>
      <div class="stats-card">
        <div class="label">在营摊主</div>
        <div class="value">{{ dashboard.activeTenantCount || 0 }}</div>
        <div style="font-size: 12px; color: #909399; margin-top: 4px;">
          转租 {{ dashboard.subleaseCount || 0 }} 户
        </div>
      </div>
      <div class="stats-card danger">
        <div class="label">本月欠租</div>
        <div class="value">¥{{ formatMoney(dashboard.unpaidRent) }}</div>
        <div style="font-size: 12px; color: #f56c6c; margin-top: 4px;">
          涉及 {{ dashboard.unpaidRentCount || 0 }} 户
        </div>
      </div>
      <div class="stats-card warning">
        <div class="label">待整改罚金</div>
        <div class="value">¥{{ formatMoney(dashboard.unrectifiedDeductions) }}</div>
        <div style="font-size: 12px; color: #e6a23c; margin-top: 4px;">
          {{ dashboard.unrectifiedDeductionCount || 0 }} 项未整改
        </div>
      </div>
      <div class="stats-card" :class="{ warning: dashboard.abnormalUtilityCount > 0 }">
        <div class="label">水电异常</div>
        <div class="value">{{ dashboard.abnormalUtilityCount || 0 }}</div>
        <div style="font-size: 12px; color: #909399; margin-top: 4px;">
          需人工核实
        </div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="recent-list">
          <div style="padding: 16px; border-bottom: 1px solid #f2f6fc; font-weight: 600;">
            最近扣分记录
          </div>
          <div v-for="item in dashboard.recentDeductions || []" :key="item.id" class="item">
            <div class="info">
              <div class="name">
                {{ item.tenant_name }}
                <el-tag size="small" type="danger" style="margin-left: 8px;">-{{ item.points }}分</el-tag>
              </div>
              <div class="desc">{{ item.reason }}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #909399;">{{ item.deduction_date }}</div>
              <div style="text-align: right; color: #f56c6c;">¥{{ formatMoney(item.amount) }}</div>
            </div>
          </div>
          <div v-if="!dashboard.recentDeductions || dashboard.recentDeductions.length === 0" 
               style="padding: 40px; text-align: center; color: #909399;">
            暂无扣分记录
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="recent-list">
          <div style="padding: 16px; border-bottom: 1px solid #f2f6fc; font-weight: 600;">
            快捷操作
          </div>
          <div style="padding: 16px;">
            <el-row :gutter="12">
              <el-col :span="12" style="margin-bottom: 12px;">
                <el-button type="primary" style="width: 100%;" @click="goTo('/hygiene')">
                  <el-icon><Brush /></el-icon>
                  录入卫生检查
                </el-button>
              </el-col>
              <el-col :span="12" style="margin-bottom: 12px;">
                <el-button type="success" style="width: 100%;" @click="goTo('/rent')">
                  <el-icon><Wallet /></el-icon>
                  生成月租金单
                </el-button>
              </el-col>
              <el-col :span="12" style="margin-bottom: 12px;">
                <el-button type="warning" style="width: 100%;" @click="goTo('/utilities')">
                  <el-icon><Lightning /></el-icon>
                  录入水电读数
                </el-button>
              </el-col>
              <el-col :span="12" style="margin-bottom: 12px;">
                <el-button type="danger" style="width: 100%;" @click="goTo('/reports')">
                  <el-icon><Document /></el-icon>
                  查看欠费明细
                </el-button>
              </el-col>
            </el-row>
            
            <div class="section-title" style="margin-top: 20px;">本月重点关注</div>
            <el-alert
              v-if="dashboard.unpaidRentCount > 0"
              title="有摊主拖欠租金，请及时催缴"
              type="warning"
              :closable="false"
              style="margin-bottom: 12px;"
            />
            <el-alert
              v-if="dashboard.unrectifiedDeductionCount > 0"
              title="有卫生问题未整改，请跟进处理"
              type="error"
              :closable="false"
              style="margin-bottom: 12px;"
            />
            <el-alert
              v-if="dashboard.abnormalUtilityCount > 0"
              title="存在水电用量异常，请核实"
              type="warning"
              :closable="false"
            />
            <el-alert
              v-if="dashboard.subleaseCount > 0"
              :title="`有 ${dashboard.subleaseCount} 户转租，请确认手续完备`"
              type="info"
              :closable="false"
              style="margin-top: 12px;"
            />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Brush, Wallet, Lightning, Document } from '@element-plus/icons-vue'
import { callApi, formatMoney } from '../utils/api'

const router = useRouter()
const dashboard = ref({})

async function loadDashboard() {
  try {
    dashboard.value = await callApi(window.api.reports.getDashboard)
  } catch (e) {
    ElMessage.error(e.message || '加载数据失败')
  }
}

function goTo(path) {
  router.push(path)
}

onMounted(() => {
  loadDashboard()
})
</script>
