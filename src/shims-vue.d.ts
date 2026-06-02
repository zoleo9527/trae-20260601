declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ApiBridge {
  house: {
    list: () => Promise<any[]>
    search: (keyword: string) => Promise<any[]>
    getById: (id: number) => Promise<any>
    create: (data: any) => Promise<number>
    update: (id: number, data: any) => Promise<boolean>
    delete: (id: number) => Promise<boolean>
  }
  resident: {
    list: () => Promise<any[]>
    search: (keyword: string) => Promise<any[]>
    getById: (id: number) => Promise<any>
    getFullInfo: (id: number) => Promise<any>
    create: (data: any) => Promise<number>
    update: (id: number, data: any) => Promise<boolean>
    delete: (id: number) => Promise<boolean>
    importCsv: (filePath: string) => Promise<{ imported: number; failed: number }>
  }
  permissionGroup: {
    list: () => Promise<any[]>
    getById: (id: number) => Promise<any>
    create: (data: any) => Promise<number>
    update: (id: number, data: any) => Promise<boolean>
    delete: (id: number) => Promise<boolean>
  }
  accessCard: {
    list: () => Promise<any[]>
    search: (keyword: string) => Promise<any[]>
    getByResident: (residentId: number) => Promise<any[]>
    create: (data: any) => Promise<number>
    updateStatus: (id: number, status: string, remark?: string) => Promise<boolean>
    simulateWrite: (cardId: number) => Promise<{ success: boolean; message: string }>
    simulateAccess: (cardNo: string, doorName: string) => Promise<{ success: boolean; reason: string; card: any }>
  }
  cardApplication: {
    list: (status?: string) => Promise<any[]>
    getById: (id: number) => Promise<any>
    create: (data: any) => Promise<number>
    review: (id: number, approved: boolean, comment: string, reviewer: string) => Promise<boolean>
    process: (id: number) => Promise<{ success: boolean; message: string }>
  }
  operationLog: {
    list: (page: number, pageSize: number, filters?: any) => Promise<{ data: any[]; total: number; page: number; pageSize: number }>
    exportCsv: (filePath: string, filters?: any) => Promise<number>
  }
  accessEvent: {
    list: (page: number, pageSize: number) => Promise<{ data: any[]; total: number; page: number; pageSize: number }>
    getRecentFailed: () => Promise<any[]>
    getStats: () => Promise<any>
  }
  app: {
    showSaveDialog: (options: any) => Promise<any>
    showOpenDialog: (options: any) => Promise<any>
    getPath: (name: string) => Promise<string>
  }
}

declare global {
  interface Window {
    api: ApiBridge
  }
}

export {}
