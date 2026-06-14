import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, STATUS_LABELS, URGENCY_LABELS } from '../types';
import { api } from '../api';
import CustomerModal from './CustomerModal';

export default function LobbyManagerPage() {
  const { user, customers, refreshCustomers } = useApp();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);

  const pendingCustomers = customers.filter(c => c.status === 'pending' || c.status === 'processing');
  const todayCustomers = customers;
  const completedToday = customers.filter(c => c.status === 'completed').length;

  const handleCreateCustomer = async (data: any) => {
    await api.customers.create({
      ...data,
      created_by: user?.id,
      assigned_to: data.assigned_to || user?.id,
    });
    refreshCustomers();
    setShowModal(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">大堂经理工作台</h1>
        <p className="text-gray-500 mt-1">管理客户排队和处理客户资料</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日接待</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{todayCustomers.length}</p>
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
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{pendingCustomers.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{completedToday}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={() => setShowModal(true)}
            className="w-full h-full flex items-center justify-center space-x-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-medium">新建客户</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">排队队列</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {pendingCustomers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>暂无待处理的客户</p>
            </div>
          ) : (
            pendingCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      customer.urgency === 'vip' ? 'bg-purple-100' :
                      customer.urgency === 'urgent' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      <span className={`font-semibold ${
                        customer.urgency === 'vip' ? 'text-purple-600' :
                        customer.urgency === 'urgent' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          customer.urgency === 'vip' ? 'bg-purple-100 text-purple-700' :
                          customer.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {URGENCY_LABELS[customer.urgency]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {customer.business_type} · {customer.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">
                        {STATUS_LABELS[customer.status]}
                      </div>
                      <div className="text-xs text-gray-500">
                        #{customer.id}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowModal(false);
            setSelectedCustomer(null);
          }}
          onSave={selectedCustomer ? undefined : handleCreateCustomer}
        />
      )}
    </div>
  );
}
