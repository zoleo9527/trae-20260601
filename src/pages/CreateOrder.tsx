import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, User, Car, Package, Wrench, Check, AlertCircle } from 'lucide-react';
import { customersApi, vehiclesApi, packagesApi, ordersApi, employeesApi, servicePrices } from '@/lib/api';
import type { Customer, Vehicle, CustomerPackage, Employee } from '@/types';

interface OrderItem {
  service_type: string;
  customer_package_id?: number;
  price: number;
  package_name?: string;
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [customerPackages, setCustomerPackages] = useState<CustomerPackage[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    employeesApi.list().then(setEmployees);
  }, []);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      customersApi.list(customerSearch).then(setCustomers);
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  const selectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedVehicle(null);
    setOrderItems([]);
    const [vehicles, packages] = await Promise.all([
      vehiclesApi.list().then((all) => all.filter((v) => v.customer_id === customer.id)),
      packagesApi.customerPackages(customer.id),
    ]);
    setCustomerVehicles(vehicles);
    setCustomerPackages(packages);
  };

  const addServiceItem = (serviceType: string, usePackage?: CustomerPackage) => {
    if (usePackage) {
      const availableItem = usePackage.items?.find(
        (i) => i.service_type === serviceType && i.remaining > 0
      );
      if (!availableItem) return;

      setOrderItems((prev) => [
        ...prev,
        {
          service_type: serviceType,
          customer_package_id: usePackage.id,
          price: 0,
          package_name: usePackage.package_name,
        },
      ]);

      setCustomerPackages((prev) =>
        prev.map((p) =>
          p.id === usePackage.id
            ? {
                ...p,
                remaining_count: p.remaining_count - 1,
                items: p.items?.map((i) =>
                  i.service_type === serviceType ? { ...i, remaining: i.remaining - 1 } : i
                ),
              }
            : p
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        { service_type: serviceType, price: servicePrices[serviceType] || 0 },
      ]);
    }
  };

  const removeItem = (index: number) => {
    const item = orderItems[index];
    if (item.customer_package_id) {
      setCustomerPackages((prev) =>
        prev.map((p) =>
          p.id === item.customer_package_id
            ? {
                ...p,
                remaining_count: p.remaining_count + 1,
                items: p.items?.map((i) =>
                  i.service_type === item.service_type ? { ...i, remaining: i.remaining + 1 } : i
                ),
              }
            : p
        )
      );
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedVehicle || orderItems.length === 0) {
      setError('请选择客户、车辆和服务项目');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const order = await ordersApi.create({
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle.id,
        employee_id: selectedEmployee?.id,
        items: orderItems.map((i) => ({
          service_type: i.service_type,
          customer_package_id: i.customer_package_id,
          price: i.price,
        })),
      });
      navigate(`/order/${order.id}`);
    } catch (err: any) {
      setError(err.message || '创建工单失败');
    }
    setSubmitting(false);
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">开单登记</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User size={20} className="text-blue-500" />
            选择客户
          </h2>

          {!selectedCustomer ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="输入客户姓名或手机号搜索..."
                className="w-full pl-10 pr-4 py-3 border border-gray-444 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {customers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-444 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-gray-444">{c.phone}</div>
                      </div>
                      {c.level === 'vip' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">VIP</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">{selectedCustomer.name[0]}</span>
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {selectedCustomer.name}
                    {selectedCustomer.level === 'vip' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">VIP</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-444">{selectedCustomer.phone}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                  setCustomerVehicles([]);
                  setCustomerPackages([]);
                  setSelectedVehicle(null);
                  setOrderItems([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                更换
              </button>
            </div>
          )}
        </div>

        {selectedCustomer && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Car size={20} className="text-green-500" />
              选择车辆
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {customerVehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedVehicle?.id === v.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-444 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-lg">{v.plate}</div>
                  <div className="text-sm text-gray-444">
                    {v.brand} {v.model} · {v.color}
                  </div>
                  {selectedVehicle?.id === v.id && (
                    <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                      <Check size={14} /> 已选择
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCustomer && selectedVehicle && (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package size={20} className="text-purple-500" />
                可用套餐
              </h2>

              {customerPackages.length > 0 ? (
                <div className="space-y-4">
                  {customerPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-4 rounded-lg border ${
                        pkg.isLow ? 'border-amber-300 bg-amber-50' : 'border-gray-444'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-semibold">{pkg.package_name}</span>
                          {pkg.isLow && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded">
                              剩余不足
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-444">
                          剩余 {pkg.remaining_count}/{pkg.total_count} 次
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pkg.items?.map((item) => (
                          <button
                            key={item.service_type}
                            onClick={() => item.remaining > 0 && addServiceItem(item.service_type, pkg)}
                            disabled={item.remaining <= 0}
                            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                              item.remaining > 0
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {item.service_type}
                            <span className="text-xs">({item.remaining}次)</span>
                            <Plus size={14} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">该客户暂无可用套餐</div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wrench size={20} className="text-orange-500" />
                单项服务
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(servicePrices).map(([type, price]) => (
                  <button
                    key={type}
                    onClick={() => addServiceItem(type)}
                    className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-2"
                  >
                    {type}
                    <span className="text-sm">¥{price}</span>
                    <Plus size={14} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User size={20} className="text-indigo-500" />
                选择技师（可选）
              </h2>
              <div className="flex flex-wrap gap-3">
                {employees
                  .filter((e) => e.role === 'technician')
                  .map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() =>
                        setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp)
                      }
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedEmployee?.id === emp.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-444 hover:border-gray-300'
                      }`}
                    >
                      {emp.name}
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}

        {orderItems.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4">服务项目清单</h2>
            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{item.service_type}</span>
                    {item.package_name && (
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                        {item.package_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={item.price === 0 ? 'text-green-600' : 'text-gray-700'}>
                      {item.price === 0 ? '套餐扣次' : `¥${item.price}`}
                    </span>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-gray-400">共 {orderItems.length} 项服务</span>
              <span className="text-xl font-bold text-gray-800">合计 ¥{totalAmount}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-444 rounded-lg text-gray-444 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedCustomer || !selectedVehicle || orderItems.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '创建工单'}
          </button>
        </div>
      </div>
    </div>
  );
}
