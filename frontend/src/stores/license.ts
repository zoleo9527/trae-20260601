import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as licenseApi from '@/api/license'

export const useLicenseStore = defineStore('license', () => {
  const licenses = ref<any[]>([])
  const currentLicense = ref<any>(null)
  const loading = ref(false)

  async function fetchLicenses(params?: Record<string, any>) {
    loading.value = true
    try {
      licenses.value = await licenseApi.getLicenses(params)
    } finally {
      loading.value = false
    }
  }

  async function fetchLicense(id: number) {
    loading.value = true
    try {
      currentLicense.value = await licenseApi.getLicense(id)
    } finally {
      loading.value = false
    }
  }

  async function createLicense(data: any) {
    return await licenseApi.createLicense(data)
  }

  async function updateLicense(id: number, data: any) {
    return await licenseApi.updateLicense(id, data)
  }

  async function reviewLicense(id: number, data: any) {
    return await licenseApi.reviewLicense(id, data)
  }

  async function deleteLicense(id: number) {
    return await licenseApi.deleteLicense(id)
  }

  async function fetchLicenseHistory(id: number) {
    return await licenseApi.getLicenseHistory(id)
  }

  return {
    licenses, currentLicense, loading,
    fetchLicenses, fetchLicense, createLicense, updateLicense, reviewLicense, deleteLicense, fetchLicenseHistory
  }
})
