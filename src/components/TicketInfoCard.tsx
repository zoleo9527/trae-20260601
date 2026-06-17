import { Ticket } from '../types';
import { Ticket as TicketIcon, Calendar, User, Building2, Globe } from 'lucide-react';

interface TicketInfoCardProps {
    ticket: Ticket;
}

export const TicketInfoCard = ({ ticket }: TicketInfoCardProps) => {
    const maskId = (id: string) => {
        if (id.length >= 18) {
            return id.slice(0, 6) + '**********' + id.slice(-4);
        }
        return id;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-blue-500">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TicketIcon className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">{ticket.ticket_type}</h3>
                        <p className="text-blue-600 font-mono text-xs sm:text-sm">{ticket.ticket_id}</p>
                    </div>
                </div>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    ticket.status === 'expired' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-600'
                }`}>
                    {ticket.status === 'expired' ? '已过期' : '有效'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">游客姓名</p>
                        <p className="text-sm sm:text-base font-medium text-gray-800 truncate">{ticket.visitor_name}</p>
                    </div>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">证件号码</p>
                        <p className="text-sm sm:text-base font-medium text-gray-800 truncate">{maskId(ticket.visitor_id)}</p>
                    </div>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">有效期</p>
                        <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                            {ticket.valid_from}
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">购买渠道</p>
                        <p className="text-sm sm:text-base font-medium text-gray-800">{ticket.channel}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};