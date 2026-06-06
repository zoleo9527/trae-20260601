import React, { useState } from 'react';
import { Key, Shield, BookOpen, ChevronDown, ChevronRight, Lock, Unlock, FileText, Package, RefreshCw, ClipboardList, ScrollText } from 'lucide-react';
import type { UserRole } from '@/types';

interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params: ApiParam[];
  responseExample: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
};

const apiEndpoints: ApiEndpoint[] = [
  {
    id: 'prep-list',
    name: '获取备货单列表',
    method: 'GET',
    path: '/api/preparation-orders',
    description: '分页查询备货单列表，支持按状态、仓库、创建人等条件筛选',
    params: [
      { name: 'page', type: 'number', required: false, description: '页码，默认 1' },
      { name: 'pageSize', type: 'number', required: false, description: '每页条数，默认 20' },
      { name: 'status', type: 'string', required: false, description: '备货单状态' },
      { name: 'warehouseCode', type: 'string', required: false, description: '仓库编码' },
      { name: 'keyword', type: 'string', required: false, description: '搜索关键词' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        total: 100,
        list: [
          {
            id: 'po001',
            orderNo: 'BH20260606001',
            status: 'PENDING_AUDIT',
            warehouseName: '美国洛杉矶仓',
            creatorName: '张明',
            totalQuantity: 1500,
            createdAt: '2026-06-06T10:00:00Z',
          },
        ],
      },
    }, null, 2),
  },
  {
    id: 'prep-detail',
    name: '获取备货单详情',
    method: 'GET',
    path: '/api/preparation-orders/:id',
    description: '根据备货单ID获取详细信息，包含商品明细',
    params: [
      { name: 'id', type: 'string', required: true, description: '备货单ID' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        id: 'po001',
        orderNo: 'BH20260606001',
        status: 'PENDING_AUDIT',
        warehouseCode: 'WH_US_LA',
        warehouseName: '美国洛杉矶仓',
        creatorName: '张明',
        items: [
          { sku: 'SKU-A001', skuName: '无线蓝牙耳机 Pro', quantity: 500, unitPrice: 128.5 },
        ],
        totalQuantity: 1500,
        totalAmount: 89250,
        remark: '618大促备货',
        createdAt: '2026-06-06T10:00:00Z',
      },
    }, null, 2),
  },
  {
    id: 'prep-create',
    name: '创建备货单',
    method: 'POST',
    path: '/api/preparation-orders',
    description: '创建新的备货单，初始状态为草稿',
    params: [
      { name: 'warehouseCode', type: 'string', required: true, description: '仓库编码' },
      { name: 'items', type: 'array', required: true, description: '商品明细列表' },
      { name: 'remark', type: 'string', required: false, description: '备注' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        id: 'po_new_001',
        orderNo: 'BH20260606009',
        status: 'DRAFT',
      },
    }, null, 2),
  },
  {
    id: 'prep-update',
    name: '更新备货单',
    method: 'PUT',
    path: '/api/preparation-orders/:id',
    description: '更新备货单信息，仅草稿状态可编辑',
    params: [
      { name: 'id', type: 'string', required: true, description: '备货单ID' },
      { name: 'warehouseCode', type: 'string', required: false, description: '仓库编码' },
      { name: 'items', type: 'array', required: false, description: '商品明细列表' },
      { name: 'remark', type: 'string', required: false, description: '备注' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        id: 'po001',
        updatedAt: '2026-06-06T12:00:00Z',
      },
    }, null, 2),
  },
  {
    id: 'prep-status',
    name: '变更备货单状态',
    method: 'PUT',
    path: '/api/preparation-orders/:id/status',
    description: '变更备货单状态，支持提交审核、审核通过、取消等操作',
    params: [
      { name: 'id', type: 'string', required: true, description: '备货单ID' },
      { name: 'status', type: 'string', required: true, description: '目标状态' },
      { name: 'remark', type: 'string', required: false, description: '状态变更备注' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        id: 'po001',
        status: 'PENDING_AUDIT',
        updatedAt: '2026-06-06T12:00:00Z',
      },
    }, null, 2),
  },
  {
    id: 'lock-list',
    name: '获取库存锁定列表',
    method: 'GET',
    path: '/api/inventory-locks',
    description: '分页查询库存锁定记录',
    params: [
      { name: 'page', type: 'number', required: false, description: '页码' },
      { name: 'pageSize', type: 'number', required: false, description: '每页条数' },
      { name: 'status', type: 'string', required: false, description: '锁定状态' },
      { name: 'sku', type: 'string', required: false, description: 'SKU编码' },
      { name: 'bizType', type: 'string', required: false, description: '业务类型' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        total: 50,
        list: [
          {
            id: 'il001',
            lockNo: 'SD20260606001',
            status: 'LOCKED',
            sku: 'SKU-A001',
            skuName: '无线蓝牙耳机 Pro',
            lockQuantity: 500,
            lockerName: '陈仓配',
            expireAt: '2026-06-13T10:00:00Z',
          },
        ],
      },
    }, null, 2),
  },
  {
    id: 'lock-create',
    name: '创建库存锁定',
    method: 'POST',
    path: '/api/inventory-locks',
    description: '手动创建库存锁定记录',
    params: [
      { name: 'sku', type: 'string', required: true, description: 'SKU编码' },
      { name: 'lockQuantity', type: 'number', required: true, description: '锁定数量' },
      { name: 'bizType', type: 'string', required: true, description: '业务类型' },
      { name: 'bizId', type: 'string', required: true, description: '业务单据ID' },
      { name: 'warehouseCode', type: 'string', required: true, description: '仓库编码' },
      { name: 'expireAt', type: 'string', required: true, description: '过期时间' },
      { name: 'remark', type: 'string', required: false, description: '备注' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        id: 'il_new_001',
        lockNo: 'SD20260606010',
        status: 'LOCKED',
      },
    }, null, 2),
  },
  {
    id: 'lock-release',
    name: '释放库存锁定',
    method: 'PUT',
    path: '/api/inventory-locks/:id/release',
    description: '手动释放已锁定的库存',
    params: [
      { name: 'id', type: 'string', required: true, description: '锁定记录ID' },
      { name: 'reason', type: 'string', required: true, description: '释放原因' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        id: 'il001',
        status: 'RELEASED',
        updatedAt: '2026-06-06T12:00:00Z',
      },
    }, null, 2),
  },
  {
    id: 'lock-detail',
    name: '获取锁定详情',
    method: 'GET',
    path: '/api/inventory-locks/:id',
    description: '获取库存锁定记录的详细信息',
    params: [
      { name: 'id', type: 'string', required: true, description: '锁定记录ID' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        id: 'il001',
        lockNo: 'SD20260606001',
        status: 'LOCKED',
        sku: 'SKU-A001',
        skuName: '无线蓝牙耳机 Pro',
        lockQuantity: 500,
        bizType: 'preparation',
        bizNo: 'BH20260602005',
        warehouseName: '日本东京仓',
        lockerName: '陈仓配',
        expireAt: '2026-06-13T10:00:00Z',
        remark: '备货单锁定库存',
        createdAt: '2026-06-03T10:00:00Z',
      },
    }, null, 2),
  },
  {
    id: 'customs-list',
    name: '获取报关资料列表',
    method: 'GET',
    path: '/api/customs-docs',
    description: '分页查询报关资料',
    params: [
      { name: 'page', type: 'number', required: false, description: '页码' },
      { name: 'status', type: 'string', required: false, description: '报关状态' },
      { name: 'preparationOrderNo', type: 'string', required: false, description: '关联备货单号' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        total: 20,
        list: [
          {
            id: 'cd001',
            docNo: 'BG20260605001',
            preparationOrderNo: 'BH20260605002',
            status: 'DECLARING',
            customsName: '深圳海关',
            createdAt: '2026-06-05T10:00:00Z',
          },
        ],
      },
    }, null, 2),
  },
  {
    id: 'return-list',
    name: '获取退件记录列表',
    method: 'GET',
    path: '/api/return-records',
    description: '分页查询退件记录，支持按原因、仓库等筛选',
    params: [
      { name: 'page', type: 'number', required: false, description: '页码' },
      { name: 'reasonCode', type: 'string', required: false, description: '退件原因编码' },
      { name: 'warehouseCode', type: 'string', required: false, description: '仓库编码' },
      { name: 'sku', type: 'string', required: false, description: 'SKU编码' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        total: 30,
        list: [
          {
            id: 'ret001',
            returnNo: 'RT20260605001',
            preparationOrderNo: 'BH20260601006',
            sku: 'SKU-F001',
            skuName: '便携式榨汁杯',
            quantity: 15,
            reasonCode: 'DAMAGED',
            handlerName: '陈仓配',
            warehouseName: '美国洛杉矶仓',
            createdAt: '2026-06-05T10:00:00Z',
          },
        ],
      },
    }, null, 2),
  },
  {
    id: 'log-list',
    name: '查询操作日志',
    method: 'GET',
    path: '/api/operation-logs',
    description: '查询系统操作日志，支持按业务类型、操作人等筛选',
    params: [
      { name: 'page', type: 'number', required: false, description: '页码' },
      { name: 'bizType', type: 'string', required: false, description: '业务类型' },
      { name: 'bizId', type: 'string', required: false, description: '业务单据ID' },
      { name: 'operator', type: 'string', required: false, description: '操作人ID' },
      { name: 'startTime', type: 'string', required: false, description: '开始时间' },
      { name: 'endTime', type: 'string', required: false, description: '结束时间' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        total: 500,
        list: [
          {
            id: 'log001',
            bizType: 'preparation',
            bizId: 'po001',
            operation: '提交审核',
            operatorName: '张明',
            detail: '提交关务审核',
            fromStatus: 'DRAFT',
            toStatus: 'PENDING_AUDIT',
            operateAt: '2026-06-06T10:00:00Z',
          },
        ],
      },
    }, null, 2),
  },
];

const permissionMatrix: { module: string; operation: string; roles: UserRole[] }[] = [
  { module: '备货单管理', operation: '查看列表', roles: ['operator', 'customs', 'warehouse', 'admin'] },
  { module: '备货单管理', operation: '创建备货单', roles: ['operator', 'admin'] },
  { module: '备货单管理', operation: '编辑备货单', roles: ['operator', 'admin'] },
  { module: '备货单管理', operation: '提交审核', roles: ['operator', 'admin'] },
  { module: '备货单管理', operation: '关务审核', roles: ['customs', 'admin'] },
  { module: '备货单管理', operation: '仓配确认', roles: ['warehouse', 'admin'] },
  { module: '备货单管理', operation: '取消备货单', roles: ['operator', 'admin'] },
  { module: '库存锁定', operation: '查看锁定列表', roles: ['operator', 'customs', 'warehouse', 'admin'] },
  { module: '库存锁定', operation: '创建锁定', roles: ['warehouse', 'admin'] },
  { module: '库存锁定', operation: '释放锁定', roles: ['warehouse', 'admin'] },
  { module: '报关资料', operation: '查看报关单', roles: ['operator', 'customs', 'admin'] },
  { module: '报关资料', operation: '提交申报', roles: ['customs', 'admin'] },
  { module: '报关资料', operation: '补充资料', roles: ['operator', 'customs', 'admin'] },
  { module: '退件管理', operation: '查看退件记录', roles: ['operator', 'warehouse', 'admin'] },
  { module: '退件管理', operation: '登记退件', roles: ['warehouse', 'admin'] },
  { module: '操作日志', operation: '查看日志', roles: ['admin'] },
];

const roleNames: Record<UserRole, string> = {
  operator: '运营',
  customs: '关务',
  warehouse: '仓配',
  admin: '管理员',
};

const endpointCategories = [
  { name: '备货单管理', icon: <Package className="w-5 h-5" />, ids: ['prep-list', 'prep-detail', 'prep-create', 'prep-update', 'prep-status'] },
  { name: '库存锁定', icon: <Lock className="w-5 h-5" />, ids: ['lock-list', 'lock-detail', 'lock-create', 'lock-release'] },
  { name: '报关资料', icon: <FileText className="w-5 h-5" />, ids: ['customs-list'] },
  { name: '退件记录', icon: <RefreshCw className="w-5 h-5" />, ids: ['return-list'] },
  { name: '操作日志', icon: <ClipboardList className="w-5 h-5" />, ids: ['log-list'] },
];

export const ApiDocs: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(endpointCategories.map(c => c.name));
  const [expandedEndpoints, setExpandedEndpoints] = useState<string[]>([]);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const toggleEndpoint = (id: string) => {
    setExpandedEndpoints(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">接口文档中心</h1>
        <p className="text-gray-500 mt-1">跨境电商海外仓备货与库存锁定系统 API 文档</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">认证方式</h2>
        </div>
        <div className="space-y-4">
          <p className="text-gray-600">
            本系统使用 <strong className="text-blue-600">Token 认证</strong> 方式保护 API 接口安全。
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <p className="text-gray-400">// 请求头中添加 Authorization</p>
            <p>Authorization: Bearer {'<your-token>'}</p>
            <p className="text-gray-400 mt-2">// 示例</p>
            <p>Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
          </div>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Token 有效期为 24 小时，过期后需要重新获取</li>
            <li>请妥善保管 Token，不要在客户端暴露</li>
            <li>所有接口都需要在请求头中携带有效的 Token</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">权限矩阵</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">模块</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
                {Object.keys(roleNames).map(role => (
                  <th key={role} className="px-4 py-3 text-center font-medium text-gray-500">
                    {roleNames[role as UserRole]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {permissionMatrix.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{item.module}</td>
                  <td className="px-4 py-3 text-gray-600">{item.operation}</td>
                  {Object.keys(roleNames).map(role => (
                    <td key={role} className="px-4 py-3 text-center">
                      {item.roles.includes(role as UserRole) ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">接口列表</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {endpointCategories.map(category => (
            <div key={category.name}>
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                {expandedCategories.includes(category.name) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-indigo-600">{category.icon}</span>
                <span className="font-medium text-gray-900">{category.name}</span>
                <span className="ml-auto text-sm text-gray-500">
                  {category.ids.length} 个接口
                </span>
              </button>
              {expandedCategories.includes(category.name) && (
                <div className="bg-gray-50 px-6 pb-4 space-y-2">
                  {category.ids.map(id => {
                    const endpoint = apiEndpoints.find(e => e.id === id);
                    if (!endpoint) return null;
                    return (
                      <div key={id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => toggleEndpoint(id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                          {expandedEndpoints.includes(id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${methodColors[endpoint.method]}`}>
                            {endpoint.method}
                          </span>
                          <span className="font-mono text-sm text-gray-700">{endpoint.path}</span>
                          <span className="ml-auto text-sm text-gray-500">{endpoint.name}</span>
                        </button>
                        {expandedEndpoints.includes(id) && (
                          <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">描述</h4>
                              <p className="text-gray-600 text-sm">{endpoint.description}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">请求参数</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-medium text-gray-500">参数名</th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-500">类型</th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-500">必填</th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-500">说明</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {endpoint.params.map(param => (
                                      <tr key={param.name}>
                                        <td className="px-3 py-2 font-mono text-gray-900">{param.name}</td>
                                        <td className="px-3 py-2 text-gray-600">{param.type}</td>
                                        <td className="px-3 py-2">
                                          {param.required ? (
                                            <span className="text-red-600 text-xs">是</span>
                                          ) : (
                                            <span className="text-gray-400 text-xs">否</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{param.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">响应示例</h4>
                              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <pre>{endpoint.responseExample}</pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
