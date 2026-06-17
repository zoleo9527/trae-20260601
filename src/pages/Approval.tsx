import { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { ReleaseRecord } from '../types';
import { getExceptionLabel, getStatusLabel } from '../data/mockData';
import { CheckCircle, XCircle, Eye, Clock, AlertCircle, User, Ticket, Building2 } from 'lucide-react';

const maskId = (id: string): string => {
    if (id.length >= 18) {
        return id.slice(0, 6) + '**********' + id.slice(-4);
    }
    return id;
};

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
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 text-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">审批管理</h2>
                        <p className="text-blue-100 mt-1">处理异常放行审批申请</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl sm:text-4xl font-bold">{pendingRecords.length}</div>
                        <div className="text-blue-100 text-sm">待审批数量</div>
                    </div>
                </div>
            </div>

            {!isSupervisor && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
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
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">记录ID</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">票号/票种</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">游客信息</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">异常类型</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">处理/申请时间</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingRecords.length > 0 ? (
                                pendingRecords.map((record) => (
                                    <tr key={record.record_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-mono text-blue-600">
                                            {record.record_id}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center space-x-2">
                                                <Ticket className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-xs sm:text-sm font-mono text-gray-800">{record.ticket_id}</p>
                                                    <p className="text-xs text-gray-500">{record.ticket_type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center space-x-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-xs sm:text-sm font-medium text-gray-800">{record.visitor_name}</p>
                                                    <p className="text-xs text-gray-500">{maskId(record.visitor_id)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                                                record.exception_type === 'expired' ? 'bg-red-100 text-red-700' :
                                                record.exception_type === 'team_mismatch' ? 'bg-orange-100 text-orange-700' :
                                                record.exception_type === 'gate_offline' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {getExceptionLabel(record.exception_type)}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <div>
                                                <div className="flex items-center space-x-1">
                                                    <Building2 className="w-3 h-3 text-gray-400" />
                                                    <span className="text-xs sm:text-sm text-gray-700">处理: {record.checker}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    {record.created_at}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                                                >
                                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    <span className="text-xs sm:text-sm">详情</span>
                                                </button>
                                                {isSupervisor && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(record.record_id)}
                                                            disabled={actionRecordId !== null}
                                                            className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-lg transition-colors ${
                                                                actionRecordId === record.record_id
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-green-100 hover:bg-green-200 text-green-600'
                                                            }`}
                                                        >
                                                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            <span className="text-xs sm:text-sm">批准</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(record.record_id)}
                                                            disabled={actionRecordId !== null}
                                                            className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-lg transition-colors ${
                                                                actionRecordId === record.record_id
                                                                    ? 'bg-red-500 text-white'
                                                                    : 'bg-red-100 hover:bg-red-200 text-red-600'
                                                            }`}
                                                        >
                                                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            <span className="text-xs sm:text-sm">拒绝</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 sm:px-6 py-12 text-center">
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
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-gray-800">审批详情</h2>
                                    <p className="text-xs sm:text-sm text-gray-500">{selectedRecord.record_id}</p>
                                </div>
                            </div>
                            <span className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm font-medium">
                                {getStatusLabel(selectedRecord.status)}
                            </span>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                    <Ticket className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium text-gray-800">票据信息</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500">票号</p>
                                        <p className="text-sm font-mono text-gray-800">{selectedRecord.ticket_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">票种</p>
                                        <p className="text-sm font-medium text-gray-800">{selectedRecord.ticket_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">渠道</p>
                                        <p className="text-sm font-medium text-gray-800">{selectedRecord.channel}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">异常类型</p>
                                        <p className="text-sm font-medium text-gray-800">{getExceptionLabel(selectedRecord.exception_type)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                    <User className="w-5 h-5 text-green-500" />
                                    <span className="font-medium text-gray-800">游客信息</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">姓名</span>
                                        <span className="text-sm font-medium text-gray-800">{selectedRecord.visitor_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">证件号码</span>
                                        <span className="text-sm font-mono text-gray-800">{maskId(selectedRecord.visitor_id)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                    <Building2 className="w-5 h-5 text-orange-500" />
                                    <span className="font-medium text-gray-800">处理信息</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">放行原因</span>
                                        <span className="text-sm font-medium text-gray-800">{selectedRecord.release_reason}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">处理人</span>
                                        <span className="text-sm font-medium text-gray-800">{selectedRecord.checker}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedRecord.remarks && (
                                <div className="bg-amber-50 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        <span className="font-medium text-gray-800">现场备注</span>
                                    </div>
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