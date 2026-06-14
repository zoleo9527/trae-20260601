const formatRecordSummary = (record) => {
  const latestAnomaly = record.anomalies && record.anomalies.length > 0
    ? record.anomalies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null

  const lastActionTime = record.completedAt || record.rejectedAt || record.startedAt || record.assignedAt || record.createdAt

  const completedItems = record.items ? record.items.filter(i => i.result !== 'PENDING') : []
  const currentStepName = record.items && record.items.length > 0
    ? (record.items[record.currentStep - 1]?.itemName || `步骤${record.currentStep}`)
    : `步骤${record.currentStep}/${record.totalSteps}`

  return {
    id: record.id,
    queueNumber: record.queueNumber,
    status: record.status,
    currentStep: record.currentStep,
    totalSteps: record.totalSteps,
    currentStepName,
    completedItemsCount: completedItems.length,
    vehicle: {
      id: record.vehicle.id,
      licensePlate: record.vehicle.licensePlate,
      vehicleType: record.vehicle.vehicleType,
      ownerName: record.vehicle.ownerName,
      ownerPhone: record.vehicle.ownerPhone
    },
    line: record.line ? {
      id: record.line.id,
      name: record.line.name,
      status: record.line.status
    } : null,
    latestAnomaly: latestAnomaly ? {
      id: latestAnomaly.id,
      anomalyType: latestAnomaly.anomalyType,
      description: latestAnomaly.description,
      operator: latestAnomaly.operator,
      createdAt: latestAnomaly.createdAt,
      resolved: latestAnomaly.resolved
    } : null,
    rejectReason: record.rejectReason,
    lastActionTime,
    createdAt: record.createdAt,
    assignedAt: record.assignedAt,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    rejectedAt: record.rejectedAt
  }
}

module.exports = { formatRecordSummary }