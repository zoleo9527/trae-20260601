import { Link } from 'react-router-dom';
import { Building2, MessageSquare, ChevronRight, User, FileText, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';
import { disputeStatusNames, formatCurrency } from '../data/mockData';

export default function Disputes() {
  const { currentRole, currentLandlordId, disputes, properties, landlords, bills, orders, expenses, repairs } = useStore();

  const filteredDisputes = currentRole === 'landlord'
    ? disputes.filter((d) => d.landlordId === currentLandlordId)
    : disputes;

  const getDisputedItem = (dispute: typeof disputes[0]) => {
    if (!dispute.itemId) return null;
    switch (dispute.type) {
      case 'income':
        return orders.find((o) => o.id === dispute.itemId);
      case 'expense':
        return expenses.find((e) => e.id === dispute.itemId);
      case 'repair':
        return repairs.find((r) => r.id === dispute.itemId);
      default:
        return null;
    }
  };

  const getItemName = (item: any, type: string) => {
    if (!item) return '';
    switch (type) {
      case 'income':
        return `${item.guestName} - ${item.checkIn}`;
      case 'expense':
        return item.description;
      case 'repair':
        return item.title;
      default:
        return '';
    }
  };

  const getItemAmount = (item: any, type: string) => {
    if (!item) return 0;
    switch (type) {
      case 'income':
        return item.totalAmount;
      case 'expense':
        return item.amount;
      case 'repair':
        return item.cost;
      default:
        return 0;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">异议处理</h1>
        <p className="text-slate-500 mt-1">共 {filteredDisputes.length} 条异议</p>
      </div>

      <div className="space-y-4">
        {filteredDisputes.map((dispute) => {
          const bill = bills.find((b) => b.id === dispute.billId);
          const landlord = landlords.find((l) => l.id === dispute.landlordId);
          const relatedProperty = properties.find((p) => p.id === bill?.propertyId);
          const disputedItem = getDisputedItem(dispute);
          const itemName = getItemName(disputedItem, dispute.type);
          const itemAmount = getItemAmount(disputedItem, dispute.type);

          return (
            <Link
              key={dispute.id}
              to={`/disputes/${dispute.id}`}
              className="block bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{dispute.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      dispute.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                      dispute.status === 'reviewing' ? 'bg-amber-50 text-amber-600' :
                      dispute.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {disputeStatusNames[dispute.status]}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mt-1">{dispute.description}</p>
                  {disputedItem && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-600">
                          <FileText size={14} />
                          <span className="font-medium">{itemName}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${dispute.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          <DollarSign size={14} />
                          <span className="font-medium">{dispute.type === 'income' ? '+' : '-'}{formatCurrency(itemAmount)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>账单月份：{bill?.year}年{bill?.month}月</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Building2 size={14} />
                      <span>{relatedProperty?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{landlord?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      <span>{dispute.messages.length} 条消息</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
