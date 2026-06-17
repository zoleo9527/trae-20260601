import { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { ReleaseRecord } from '../types';
import { getExceptionLabel } from '../data/mockData';
import { Headphones, Search, MessageSquare, Send, User, Ticket, AlertCircle, CheckCircle, Clock, Phone } from 'lucide-react';

export const CustomerService = () => {
    const { records, currentUser, updateCSRemarks } = useTicketStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<ReleaseRecord | null>(null);
    const [remarks, setRemarks] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');

    const isCS = currentUser?.role === 'customer_service';

    const approvedRecords = records.filter(r => r.status === 'approved');
    const pendingRecords = approvedRecords.filter(r => !r.cs_remarks);
    const processedRecords = approvedRecords.filter(r => r.cs_remarks);

    const displayRecords = activeTab === 'pending' ? pendingRecords : processedRecords;

    const filteredRecords = displayRecords.filter(record => 
        record.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.record_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = () => {
        if (!selectedRecord || !remarks.trim()) return;
        
        updateCSRemarks(selectedRecord.record_id, remarks, currentUser?.name || '');
        setShowSuccess(true);
        setRemarks('');
        setSelectedRecord(null);
        
        setTimeout(() => {
            setShowSuccess(false);
        }, 3000);
    };

    const csActionTypes = [
        { value: 'refund', label: '退票处理', color: 'bg-red-100 text-red-700' },
        { value: 'reschedule', label: '改期处理', color: 'bg-blue-100 text-blue-700' },
        { value: 'complaint', label: '投诉处理', color: 'bg-orange-100 text-orange-700' },
        { value: 'info', label: '咨询回复', color: 'bg-green-100 text-green-700' }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
            {showSuccess && (
                <div className="mb-4 sm:mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-green-800">处理成功</p>
                        <p className="text-sm text-green-600">客服备注已保存</p>
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Headphones className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">客服处理中心</h2>
                            <p className="text-green-100">处理已批准放行记录的退改或投诉</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-white">{pendingRecords.length}</div>
                            <div className="text-xs sm:text-sm text-green-200">待处理</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-white">{processedRecords.length}</div>
                            <div className="text-xs sm:text-sm text-green-200">已处理</div>
                        </div>
                    </div>
                </div>
            </div>

            {!isCS && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                        <div>
                            <p className="font-medium text-yellow-800">权限提示</p>
                            <p className="text-sm text-yellow-600">
                                当前用户为{currentUser?.role === 'checker' ? '检票员' : '主管'}，
                                无客服处理权限，请使用客服账号登录
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setActiveTab('pending')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            activeTab === 'pending'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        待处理 ({pendingRecords.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('processed')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            activeTab === 'processed'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        已处理 ({processedRecords.length})
                                    </button>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="搜索票号、游客姓名..."
                                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <div
                                        key={record.record_id}
                                        onClick={() => isCS && setSelectedRecord(record)}
                                        className={`p-4 sm:p-5 transition-colors ${
                                            selectedRecord?.record_id === record.record_id
                                                ? 'bg-green-50 border-l-4 border-green-500'
                                                : 'hover:bg-gray-50 cursor-pointer'
                                        } ${!isCS ? 'cursor-default' : ''}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3 sm:space-x-4">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                                        <p className="font-semibold text-gray-800">{record.visitor_name}</p>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                            record.cs_remarks ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {record.cs_remarks ? '已处理' : '待处理'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500 font-mono">{record.ticket_id}</span>
                                                        <span className="text-xs text-gray-400">|</span>
                                                        <span className="text-xs text-gray-500">{record.ticket_type}</span>
                                                        <span className="text-xs text-gray-400">|</span>
                                                        <span className="text-xs text-gray-500">{record.channel}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    {record.created_at}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs ${
                                                record.exception_type === 'expired' ? 'bg-red-100 text-red-700' :
                                                record.exception_type === 'team_mismatch' ? 'bg-orange-100 text-orange-700' :
                                                record.exception_type === 'gate_offline' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {getExceptionLabel(record.exception_type)}
                                            </span>
                                            <span className="text-xs text-gray-500">|</span>
                                            <span className="text-xs text-gray-600">处理人: {record.checker}</span>
                                            {record.approver && (
                                                <>
                                                    <span className="text-xs text-gray-500">|</span>
                                                    <span className="text-xs text-gray-600">审批: {record.approver}</span>
                                                </>
                                            )}
                                        </div>
                                        {record.cs_remarks && (
                                            <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <MessageSquare className="w-4 h-4 text-green-500" />
                                                    <span className="text-xs font-medium text-green-700">客服备注</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{record.cs_remarks}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">没有找到匹配的记录</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {selectedRecord ? (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-24">
                            <div className="bg-green-500 p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">处理游客诉求</h3>
                                        <p className="text-green-100 text-sm">{selectedRecord.visitor_name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Ticket className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-medium text-blue-700">票据信息</span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-gray-500">票号:</span> <span className="font-mono">{selectedRecord.ticket_id}</span></p>
                                        <p><span className="text-gray-500">票种:</span> {selectedRecord.ticket_type}</p>
                                        <p><span className="text-gray-500">渠道:</span> {selectedRecord.channel}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-orange-500" />
                                        <span className="text-xs font-medium text-gray-700">异常信息</span>
                                    </div>
                                    <p className="text-sm">{getExceptionLabel(selectedRecord.exception_type)}</p>
                                    <p className="text-xs text-gray-500 mt-1">{selectedRecord.release_reason}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">选择处理类型</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {csActionTypes.map((action) => (
                                            <button
                                                key={action.value}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${action.color}`}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                        <MessageSquare className="w-4 h-4 mr-2 text-green-500" />
                                        处理备注
                                    </label>
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="请输入处理结果，如退票金额、改期时间、投诉处理情况等..."
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-all"
                                        rows={4}
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setSelectedRecord(null)}
                                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!remarks.trim()}
                                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                            remarks.trim()
                                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <Send className="w-4 h-4" />
                                        <span>保存备注</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Headphones className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="font-bold text-gray-700 mb-2">选择待处理记录</h3>
                            <p className="text-sm text-gray-500">从左侧列表选择一条记录进行处理</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};