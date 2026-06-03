import OrderTable from '@/components/OrderTable';

const ColorPending = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">待色号确认</h1>
        <p className="text-gray-500 mt-1">需要确认色号的订单列表</p>
      </div>
      
      <OrderTable filterStatus={['model_received', 'pending']} />
    </div>
  );
};

export default ColorPending;
