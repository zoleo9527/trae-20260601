import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as tenantApi from '@/api/tenant'

export const useTenantStore = defineStore('tenant', () => {
  const tenants = ref<any[]>([])
  const currentTenant = ref<any>(null)
  const loading = ref(false)

  async function fetchTenants(params?: Record<string, any>) {
    loading.value = true
    try {
      tenants.value = await tenantApi.getTenants(params)
    } finally {
      loading.value = false
    }
  }

  async function fetchTenant(id: number) {
    loading.value = true
    try {
      currentTenant.value = await tenantApi.getTenant(id)
    } finally {
      loading.value = false
    }
  }

  async function createTenant(data: any) {
    return await tenantApi.createTenant(data)
  }

  async function updateTenant(id: number, data: any) {
    return await tenantApi.updateTenant(id, data)
  }

  async function reviewTenant(id: number, data: any) {
    return await tenantApi.reviewTenant(id, data)
  }

  async function deleteTenant(id: number) {
    return await tenantApi.deleteTenant(id)
  }

  async function fetchTenantHistory(id: number) {
    return await tenantApi.getTenantHistory(id)
  }

  return {
    tenants, currentTenant, loading,
    fetchTenants, fetchTenant, createTenant, updateTenant, reviewTenant, deleteTenant, fetchTenantHistory
  }
})
