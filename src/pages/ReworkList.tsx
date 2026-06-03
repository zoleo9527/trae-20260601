import OrderTable from '@/components/OrderTable';

const ReworkList = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">返工处理</h1>
        <p className="text-gray-500 mt-1">需要返工的订单列表</p>
      </div>
      
      <OrderTable filterStatus={['rework', 'quality_check']} />
    </div>
  );
};

export default ReworkList;
