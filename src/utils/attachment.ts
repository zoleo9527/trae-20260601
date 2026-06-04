export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  uploadedBy: string
}

let attachmentStore: Record<string, Attachment[]> = {}

export function addAttachment(reportId: string, file: File, uploadedBy: string): Attachment {
  const attachment: Attachment = {
    id: `A${Date.now().toString(36).toUpperCase()}`,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  }

  if (!attachmentStore[reportId]) {
    attachmentStore[reportId] = []
  }
  attachmentStore[reportId].push(attachment)

  return attachment
}

export function getAttachments(reportId: string): Attachment[] {
  return attachmentStore[reportId] || []
}

export function removeAttachment(reportId: string, attachmentId: string): void {
  if (attachmentStore[reportId]) {
    attachmentStore[reportId] = attachmentStore[reportId].filter((a) => a.id !== attachmentId)
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
