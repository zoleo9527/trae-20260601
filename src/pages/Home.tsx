import { Edit3, Eye, Filter, LogOut, Plus, Search, Store, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, useOfflineStatus } from '../store';
import { FilterParams, RecordStatus, ROLE_CONFIG, STATUS_COLORS, STATUS_LABELS } from '../types';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout, getFilteredRecords, getStatusStats, setFilters, filters, clearFilters, setOnline } = useAppStore();
  
  const isOnline = useOfflineStatus();
  
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);
  
  const [searchKeyword, setSearchKeyword] = useState(filters.keyword || '');
  const [selectedStatus, setSelectedStatus] = useState<RecordStatus | ''>(filters.status || '');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const records = getFilteredRecords();
  const stats = getStatusStats();

  const handleSearch = () => {
    const newFilters: FilterParams = { ...filters };
    if (searchKeyword.trim()) {
      newFilters.keyword = searchKeyword.trim();
    } else {
      delete newFilters.keyword;
    }
    setFilters(newFilters);
  };

  const handleStatusFilter = (status: RecordStatus | '') => {
    setSelectedStatus(status);
    const newFilters: FilterParams = { ...filters };
    if (status) {
      newFilters.status = status;
    } else {
      delete newFilters.status;
    }
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchKeyword('');
    setSelectedStatus('');
    setShowFilterPanel(false);
  };

  const handleViewDetail = (id: string) => {
    navigate(`/detail/${id}`);
  };

  const handleReview = (id: string) => {
    navigate(`/review/${id}`);
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleEditRejected = (id: string) => {
    navigate(`/register/${id}`);
  };

  const statusOrder: RecordStatus[] = ['pending', 'reviewing', 'approved', 'rejected', 'closed', 'recheck'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">典当当品登记系统</h1>
                {user && (
                  <p className="text-xs text-gray-500">{ROLE_CONFIG[user.role].name} - {user.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isOnline ? '在线' : '离线'}
              </div>

              {user && user.role === 'counter' && (
                <button
                  onClick={handleRegister}
                  className="btn-gold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  登记当品
                </button>
              )}

              <button
                onClick={logout}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {statusOrder.map((status) => (
            <div
              key={status}
              className={`card cursor-pointer transition-all hover:shadow-md ${
                selectedStatus === status ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => handleStatusFilter(selectedStatus === status ? '' : status)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{STATUS_LABELS[status]}</span>
                <span className={`status-badge ${STATUS_COLORS[status]}`}>{stats[status]}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索编号、品类、品牌、型号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="btn-primary flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                搜索
              </button>
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="btn-secondary flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                筛选
              </button>
              {(filters.status || filters.keyword) && (
                <button
                  onClick={handleClearFilters}
                  className="btn-secondary"
                >
                  清除
                </button>
              )}
            </div>
          </div>

          {showFilterPanel && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => {
                      const newFilters: FilterParams = { ...filters };
                      if (e.target.value) {
                        newFilters.startDate = e.target.value;
                      } else {
                        delete newFilters.startDate;
                      }
                      setFilters(newFilters);
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => {
                      const newFilters: FilterParams = { ...filters };
                      if (e.target.value) {
                        newFilters.endDate = e.target.value;
                      } else {
                        delete newFilters.endDate;
                      }
                      setFilters(newFilters);
                    }}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {records.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无匹配的记录</p>
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {record.photos.length > 0 ? (
                      <img
                        src={record.photos[0]}
                        alt={record.model}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Store className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{record.id}</span>
                          <span className={`status-badge ${STATUS_COLORS[record.status]}`}>
                            {STATUS_LABELS[record.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {record.category} · {record.brand || '-'} · {record.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>成色: {record.condition}</span>
                      <span>重量: {record.weight}g</span>
                      {record.estimatedValue && (
                        <span className="text-gold-600 font-semibold">估价: ¥{record.estimatedValue.toLocaleString()}</span>
                      )}
                    </div>
                    {record.remark && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {record.remark}
                      </p>
                    )}
                    {record.rejectReason && (
                      <p className="text-sm text-red-500 mt-2">
                        退回原因: {record.rejectReason}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">
                        {record.operatorName} · {record.createdAt}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(record.id)}
                          className="btn-secondary flex items-center gap-1 text-sm"
                        >
                          <Eye className="w-3 h-3" />
                          查看
                        </button>
                        {user && user.role === 'warehouse' && (record.status === 'pending' || record.status === 'reviewing') && (
                          <button
                            onClick={() => handleReview(record.id)}
                            className="btn-primary flex items-center gap-1 text-sm"
                          >
                            <Edit3 className="w-3 h-3" />
                            复核
                          </button>
                        )}
                        {user && user.role === 'counter' && record.status === 'rejected' && (
                          <button
                            onClick={() => handleEditRejected(record.id)}
                            className="btn-primary flex items-center gap-1 text-sm"
                          >
                            <Edit3 className="w-3 h-3" />
                            修改
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
