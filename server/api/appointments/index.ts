import { getAppointments } from '~/server/utils/dataStore'

export default defineEventHandler(() => {
  return getAppointments()
})