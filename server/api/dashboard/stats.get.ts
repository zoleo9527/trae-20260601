import { mockDashboardStats } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  return {
    code: 200,
    message: 'success',
    data: mockDashboardStats
  }
})
