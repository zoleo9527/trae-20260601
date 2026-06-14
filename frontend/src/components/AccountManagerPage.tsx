import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DueDiligence, Customer, DUE_DILIGENCE_STATUS_LABELS, STATUS_LABELS } from '../types';
import { api } from '../api';
import CustomerDocumentModal from './CustomerDocumentModal';

export default function AccountManagerPage() {
  const { user, customers, dueDiligences, refreshDueDiligences } = useApp();
  const [selectedDueDiligence, setSelectedDueDiligence] = useState<DueDiligence | null>(null);
  const [showModal, setShowModal] = useState(false);

  const myCustomers = customers.filter(c => c.assigned_to === user?.id && c.status !== 'completed');
  const myDueDiligences = dueDiligences.filter(d => d.assigned_to === user?.id);

  const handleStatusChange = async (dueDiligenceId: number, status: string) => {
    await api.dueDiligence.update(dueDiligenceId, { status });
    refreshDueDiligences();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">客户经理工作台</h1>
        <p className="text-gray-500 mt-1">处理客户资料和尽调补件</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">我的客户</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{myCustomers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">尽调补件</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{myDueDiligences.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理补件</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {myDueDiligences.filter(d => d.status === 'pending' || d.status === 'processing').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {myDueDiligences.filter(d => d.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">我的客户</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {myCustomers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>暂无分配的的客户</p>
              </div>
            ) : (
              myCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setShowModal(true)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {customer.business_type} · {customer.phone}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      customer.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      customer.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {STATUS_LABELS[customer.status]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">尽调补件任务</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {myDueDiligences.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>暂无尽调补件任务</p>
              </div>
            ) : (
              myDueDiligences.map((dueDiligence) => (
                <div
                  key={dueDiligence.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedDueDiligence(dueDiligence);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {dueDiligence.customer_name || `客户 #${dueDiligence.customer_id}`}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        尽调补件 #{dueDiligence.id}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      dueDiligence.status === 'completed' ? 'bg-green-100 text-green-700' :
                      dueDiligence.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      dueDiligence.status === 'submitted' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {DUE_DILIGENCE_STATUS_LABELS[dueDiligence.status]}
                    </span>
                  </div>
                  {dueDiligence.inherited_notes && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded mt-2">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="line-clamp-2">{dueDiligence.inherited_notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <CustomerDocumentModal
          dueDiligence={selectedDueDiligence}
          onClose={() => {
            setShowModal(false);
            setSelectedDueDiligence(null);
          }}
        />
      )}
    </div>
  );
}
