'use client'

import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatDateTime } from '@/lib/utils'
import { FileText, Clock, User, AlertCircle, CheckCircle, Download, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Drawing {
  id: string
  version: string
  revision: string
  title: string
  description: string
  status: string
  fileName: string
  part: { partNumber: string; name: string }
  createdBy: { name: string }
  approvedAt: string
  createdAt: string
  canUseOldVersion: boolean
  isObsolete: boolean
  changeLog: string
}

export default function DrawingsPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([])

  useEffect(() => {
    fetchDrawings()
  }, [])

  const fetchDrawings = async () => {
    try {
      const response = await fetch('/api/drawings')
      const data = await response.json()
      setDrawings(data)
    } catch (error) {
      console.error('Failed to fetch drawings:', error)
    }
  }

  const groupedDrawings = drawings.reduce((acc, drawing) => {
    const partNumber = drawing.part.partNumber
    if (!acc[partNumber]) {
      acc[partNumber] = []
    }
    acc[partNumber].push(drawing)
    return acc
  }, {} as Record<string, Drawing[]>)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">图纸版本管理</h1>
            <p className="text-gray-500 mt-1">查看和管理图纸版本历史</p>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedDrawings).map(([partNumber, partDrawings]) => {
            const latestDrawing = partDrawings[0]
            const sortedDrawings = [...partDrawings].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            return (
              <div key={partNumber} className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {latestDrawing.part.name}
                      </h2>
                      <p className="text-sm text-gray-500">零件号：{partNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">当前版本</p>
                      <p className="text-lg font-bold text-primary-600">
                        {latestDrawing.version}.{latestDrawing.revision}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                    
                    <div className="space-y-6">
                      {sortedDrawings.map((drawing, index) => (
                        <div key={drawing.id} className="relative pl-14">
                          <div className={`absolute left-4 w-5 h-5 rounded-full border-4 ${
                            index === 0 
                              ? 'bg-primary-500 border-primary-200' 
                              : 'bg-white border-gray-300'
                          }`} />
                          
                          <div className={`p-4 rounded-xl border ${
                            index === 0 
                              ? 'border-primary-200 bg-primary-50' 
                              : 'border-gray-200 bg-white'
                          }`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  index === 0 ? 'bg-primary-500' : 'bg-gray-100'
                                }`}>
                                  <FileText 
                                    size={20} 
                                    className={index === 0 ? 'text-white' : 'text-gray-600'} 
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">
                                      版本 {drawing.version}.{drawing.revision}
                                    </h3>
                                    {index === 0 && (
                                      <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                                        最新
                                      </span>
                                    )}
                                    <StatusBadge type="drawing" status={drawing.status} />
                                  </div>
                                  <p className="text-sm text-gray-500">{drawing.title}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {drawing.fileName && (
                                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Download size={18} />
                                  </button>
                                )}
                                <Link 
                                  href={`/drawings/${drawing.id}`}
                                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                >
                                  <Eye size={18} />
                                </Link>
                              </div>
                            </div>

                            {drawing.description && (
                              <p className="text-sm text-gray-600 mb-3">{drawing.description}</p>
                            )}

                            {drawing.changeLog && (
                              <div className="p-3 bg-white rounded-lg border border-gray-200 mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">变更记录</p>
                                <p className="text-sm text-gray-600">{drawing.changeLog}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <User size={14} />
                                <span>创建人：{drawing.createdBy.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{formatDateTime(drawing.createdAt)}</span>
                              </div>
                              {drawing.approvedAt && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle size={14} />
                                  <span>批准：{formatDate(drawing.approvedAt)}</span>
                                </div>
                              )}
                            </div>

                            {drawing.canUseOldVersion && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                                <AlertCircle size={14} />
                                <span>允许使用旧版本生产</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
