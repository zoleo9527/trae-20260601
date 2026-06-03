import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, BedDouble, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../data/mockData';

export default function Properties() {
  const { currentRole, currentLandlordId, properties, orders, bills } = useStore();
  const [filterLandlord, setFilterLandlord] = useState<string>('all');

  const filteredProperties = currentRole === 'landlord'
    ? properties.filter((p) => p.landlordId === currentLandlordId)
    : filterLandlord === 'all'
    ? properties
    : properties.filter((p) => p.landlordId === filterLandlord);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">房源管理</h1>
          <p className="text-slate-500 mt-1">共 {filteredProperties.length} 套房源</p>
        </div>
        {currentRole !== 'landlord' && (
          <select
            value={filterLandlord}
            onChange={(e) => setFilterLandlord(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">全部房东</option>
            {useStore.getState().landlords.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredProperties.map((property) => {
          const propertyOrders = orders.filter((o) => o.propertyId === property.id);
          const propertyBills = bills.filter((b) => b.propertyId === property.id);
          const totalIncome = propertyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
          const latestBill = propertyBills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          const landlord = useStore.getState().landlords.find((l) => l.id === property.landlordId);

          return (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={property.image}
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-slate-700">
                  {property.type === 'apartment' ? '公寓' : property.type === 'house' ? '洋房' : '别墅'}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{property.name}</h3>
                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                      <MapPin size={14} />
                      <span className="truncate max-w-xs">{property.address}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <BedDouble size={16} className="text-slate-400" />
                    <span className="text-slate-600 text-sm">{property.bedrooms} 室</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-slate-400" />
                    <span className="text-slate-600 text-sm">{propertyOrders.length} 订单</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-slate-500 text-xs">累计收入</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-emerald-500" size={16} />
                      <span className="font-bold text-emerald-600 text-lg">{formatCurrency(totalIncome)}</span>
                    </div>
                  </div>
                  {latestBill && (
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">最新账单</p>
                      <p className="font-medium text-slate-700">{latestBill.year}年{latestBill.month}月</p>
                    </div>
                  )}
                </div>

                {landlord && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-teal-600 font-medium text-sm">{landlord.name[0]}</span>
                    </div>
                    <span className="text-slate-600 text-sm">{landlord.name}</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
