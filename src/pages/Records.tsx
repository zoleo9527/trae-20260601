import { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { RecordTable } from '../components/RecordTable';
import { DetailModal } from '../components/DetailModal';
import { ReleaseRecord } from '../types';
import { Search, Filter, Download } from 'lucide-react';

export const Records = () => {
    const { records } = useTicketStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRecord, setSelectedRecord] = useState<ReleaseRecord | null>(null);

    const filteredRecords = records.filter(record => {
        const matchesSearch = 
            record.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.checker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.record_id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
            statusFilter === 'all' || record.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const statusOptions = [
        { value: 'all', label: '全部' },
        { value: 'pending', label: '待审批' },
        { value: 'approved', label: '已批准' },
        { value: 'rejected', label: '已拒绝' }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜索票号、处理人或记录ID..."
                                className="w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors">
                            <Download className="w-5 h-5" />
                            <span>导出记录</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-6 mt-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-500">总记录:</span>
                        <span className="font-bold text-gray-800">{records.length}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-500">待审批:</span>
                        <span className="font-bold text-yellow-600">{records.filter(r => r.status === 'pending').length}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-500">已批准:</span>
                        <span className="font-bold text-green-600">{records.filter(r => r.status === 'approved').length}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-500">已拒绝:</span>
                        <span className="font-bold text-red-600">{records.filter(r => r.status === 'rejected').length}</span>
                    </div>
                </div>
            </div>

            <RecordTable 
                records={filteredRecords} 
                onViewDetail={setSelectedRecord} 
            />

            {filteredRecords.length === 0 && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <p className="text-gray-500">没有找到匹配的记录</p>
                </div>
            )}

            {selectedRecord && (
                <DetailModal 
                    record={selectedRecord} 
                    onClose={() => setSelectedRecord(null)} 
                />
            )}
        </div>
    );
};