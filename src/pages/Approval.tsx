import { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { ReleaseRecord } from '../types';
import { getExceptionLabel, getStatusLabel } from '../data/mockData';
import { CheckCircle, XCircle, Eye, Clock, AlertCircle } from 'lucide-react';

export const Approval = () => {
    const { records, currentUser, approveRecord, rejectRecord } = useTicketStore();
    const [selectedRecord, setSelectedRecord] = useState<ReleaseRecord | null>(null);
    const [actionRecordId, setActionRecordId] = useState<string | null>(null);

    const pendingRecords = records.filter(r => r.status === 'pending');
    const isSupervisor = currentUser?.role === 'supervisor';

    const handleApprove = (recordId: string) => {
        if (!currentUser?.name) return;
        setActionRecordId(recordId);
        approveRecord(recordId, currentUser.name);
        setTimeout(() => {
            setActionRecordId(null);
            setSelectedRecord(null);
        }, 1000);
    };

    const handleReject = (recordId: string) => {
        if (!currentUser?.name) return;
        setActionRecordId(recordId);
        rejectRecord(recordId, currentUser.name);
        setTimeout(() => {
            setActionRecordId(null);
            setSelectedRecord(null);
        }, 1000);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 mb-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">审批管理</h2>
                        <p className="text-blue-100 mt-1">处理异常放行审批申请</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">{pendingRecords.length}</div>
                        <div className="text-blue-100">待审批数量</div>
                    </div>
                </div>
            </div>

            {!isSupervisor && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                        <div>
                            <p className="font-medium text-yellow-800">权限提示</p>
                            <p className="text-sm text-yellow-600">
                                当前用户为{currentUser?.role === 'checker' ? '检票员' : '客服'}，
                                无审批权限，请使用主管账号登录
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">记录ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">票号</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">异常类型</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">放行原因</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">处理人</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">申请时间</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingRecords.length > 0 ? (
                                pendingRecords.map((record) => (
                                    <tr key={record.record_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-blue-600">
                                            {record.record_id}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-800">
                                            {record.ticket_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                                                {getExceptionLabel(record.exception_type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={record.release_reason}>
                                            {record.release_reason}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {record.checker}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4" />
                                                {record.created_at}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span className="text-sm">详情</span>
                                                </button>
                                                {isSupervisor && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(record.record_id)}
                                                            disabled={actionRecordId !== null}
                                                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                                                                actionRecordId === record.record_id
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-green-100 hover:bg-green-200 text-green-600'
                                                            }`}
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span className="text-sm">批准</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(record.record_id)}
                                                            disabled={actionRecordId !== null}
                                                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                                                                actionRecordId === record.record_id
                                                                    ? 'bg-red-500 text-white'
                                                                    : 'bg-red-100 hover:bg-red-200 text-red-600'
                                                            }`}
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            <span className="text-sm">拒绝</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <CheckCircle className="w-16 h-16 text-green-300 mb-4" />
                                            <p className="text-gray-500">暂无待审批的申请</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">审批详情</h2>
                                    <p className="text-sm text-gray-500">{selectedRecord.record_id}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                {getStatusLabel(selectedRecord.status)}
                            </span>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-3">异常信息</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">异常类型</span>
                                        <span className="font-medium">{getExceptionLabel(selectedRecord.exception_type)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">放行原因</span>
                                        <span className="font-medium">{selectedRecord.release_reason}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-3">票据信息</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">票号</span>
                                        <span className="font-medium font-mono">{selectedRecord.ticket_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">处理人</span>
                                        <span className="font-medium">{selectedRecord.checker}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedRecord.remarks && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-3">现场备注</h4>
                                    <p className="text-sm text-gray-700">{selectedRecord.remarks}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">{selectedRecord.created_at}</span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setSelectedRecord(null)}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                                    >
                                        关闭
                                    </button>
                                    {isSupervisor && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    handleApprove(selectedRecord.record_id);
                                                }}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                批准放行
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleReject(selectedRecord.record_id);
                                                }}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                拒绝申请
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};