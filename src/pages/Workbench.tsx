import { CheckCircle, Clock, CreditCard, QrCode, RefreshCw, Search, Users, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { ExceptionSelector } from '../components/ExceptionSelector';
import { ReleaseForm } from '../components/ReleaseForm';
import { TicketInfoCard } from '../components/TicketInfoCard';
import { useTicketStore } from '../store/ticketStore';
import { ExceptionType, Ticket } from '../types';

export const Workbench = () => {
    const { searchTicket } = useTicketStore();
    const [ticketId, setTicketId] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [selectedException, setSelectedException] = useState<ExceptionType | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = () => {
        if (!ticketId.trim()) {
            setError('请输入票号');
            return;
        }

        const ticket = searchTicket(ticketId.trim().toUpperCase());
        if (ticket) {
            setSelectedTicket(ticket);
            setSelectedException(null);
            setError('');
        } else {
            setError('未找到该票号，请检查输入');
            setSelectedTicket(null);
            setSelectedException(null);
        }
    };

    const handleSubmit = () => {
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            setSelectedTicket(null);
            setSelectedException(null);
            setTicketId('');
        }, 2000);
    };

    const handleQuickSelect = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setTicketId(ticket.ticket_id);
        setSelectedException(null);
        setError('');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
            {showSuccess && (
                <div className="mb-4 sm:mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3 shadow-sm">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-green-800 text-base sm:text-lg">操作成功</p>
                        <p className="text-sm text-green-600 truncate">
                            {selectedException === 'gate_offline' ? '已记录放行，游客可直接入园' : '已提交审批申请，等待主管确认'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setShowSuccess(false);
                            setSelectedTicket(null);
                            setSelectedException(null);
                            setTicketId('');
                        }}
                        className="text-green-600 hover:text-green-700 font-medium text-sm px-2"
                    >
                        继续处理
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">快速查票</h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={ticketId}
                                    onChange={(e) => setTicketId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="输入票号或扫码..."
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="flex space-x-2">
                                <button className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors">
                                    <QrCode className="w-5 h-5" />
                                    <span>扫码</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setTicketId('');
                                        setSelectedTicket(null);
                                        setSelectedException(null);
                                        setError('');
                                    }}
                                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>

                            {error && (
                                <p className="text-red-500 text-sm">{error}</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">快速测试票</h3>
                            <span className="text-xs text-gray-500">点击快速选择</span>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleQuickSelect({
                                    ticket_id: 'TK202401010001',
                                    ticket_type: '家庭套票',
                                    channel: '官网',
                                    visitor_name: '张三',
                                    visitor_id: '110101199001011234',
                                    valid_from: '2024-01-01',
                                    valid_to: '2024-01-02',
                                    status: 'expired'
                                })}
                                className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-all hover:shadow-md group"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-800">套票过期</p>
                                        <p className="text-xs text-gray-500">家庭套票 - 张三</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs font-medium">过期</span>
                            </button>

                            <button
                                onClick={() => handleQuickSelect({
                                    ticket_id: 'TK202401010002',
                                    ticket_type: '团队票',
                                    channel: '旅行社',
                                    visitor_name: '李四',
                                    visitor_id: '320101198506065678',
                                    valid_from: '2024-01-15',
                                    valid_to: '2024-01-15',
                                    status: 'valid'
                                })}
                                className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-lg transition-all hover:shadow-md"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <Users className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-800">团队票名单不符</p>
                                        <p className="text-xs text-gray-500">团队票 - 李四</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-orange-200 text-orange-700 rounded text-xs font-medium">名单不符</span>
                            </button>

                            <button
                                onClick={() => handleQuickSelect({
                                    ticket_id: 'TK202401010004',
                                    ticket_type: '成人票',
                                    channel: '现场',
                                    visitor_name: '赵六',
                                    visitor_id: '440301199203037890',
                                    valid_from: '2024-01-15',
                                    valid_to: '2024-01-15',
                                    status: 'valid'
                                })}
                                className="w-full flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-lg transition-all hover:shadow-md"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <WifiOff className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-800">闸机离线</p>
                                        <p className="text-xs text-gray-500">成人票 - 赵六</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-amber-200 text-amber-700 rounded text-xs font-medium">离线</span>
                            </button>

                            <button
                                onClick={() => handleQuickSelect({
                                    ticket_id: 'TK202401010003',
                                    ticket_type: '老人票',
                                    channel: 'OTA',
                                    visitor_name: '王五',
                                    visitor_id: '110101194512123456',
                                    valid_from: '2024-01-15',
                                    valid_to: '2024-01-15',
                                    status: 'valid'
                                })}
                                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-all hover:shadow-md"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-800">老人证件核验失败</p>
                                        <p className="text-xs text-gray-500">老人票 - 王五</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-blue-200 text-blue-700 rounded text-xs font-medium">核验失败</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {!selectedTicket ? (
                        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-12 text-center">
                            <div className="w-16 sm:w-20 h-16 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <Search className="w-8 sm:w-10 h-8 sm:h-10 text-blue-400" />
                            </div>
                            <h3 className="text-base sm:text-xl font-bold text-gray-700 mb-2">请查询票据信息</h3>
                            <p className="text-sm sm:text-base text-gray-500">输入票号或使用快速测试票开始处理异常放行</p>
                        </div>
                    ) : (
                        <>
                            <TicketInfoCard ticket={selectedTicket} />
                            
                            <ExceptionSelector
                                selected={selectedException}
                                onChange={setSelectedException}
                            />

                            {selectedException && (
                                <ReleaseForm
                                    ticket={selectedTicket}
                                    exceptionType={selectedException}
                                    onSubmit={handleSubmit}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};