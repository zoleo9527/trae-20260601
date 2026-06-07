
import { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, message, Alert, Descriptions } from 'antd';
import { RotateCcw, User, Info } from 'lucide-react';
import { systemApi, userApi } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { User as UserType } from '../../shared/types';

const roleNames: Record<string, string> = {
  store_manager: '店长',
  supervisor: '督导',
  product_specialist: '商品专员',
};

export default function Settings() {
  const user = useUserStore((s) => s.user);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [demoUsers, setDemoUsers] = useState<UserType[]>([]);

  useEffect(() => {
    userApi.getDemoUsers().then(setDemoUsers).catch(console.error);
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await systemApi.reset();
      message.success('数据已重置，即将跳转到登录页');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error: any) {
      message.error(error.message || '重置失败');
    } finally {
      setResetting(false);
    }
  };

  const columns = [
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => <span className="font-medium">{roleNames[role] || role}</span>,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      key: 'storeName',
      render: (name: string) => name || '-',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center">
              <User size={20} className="mr-2 text-blue-600" />
              演示账号
            </div>
          }
          className="border-0 shadow-sm"
        >
          <Alert
            message="系统提供3个演示账号，分别对应不同角色权限"
            type="info"
            showIcon
            className="mb-4"
          />
          <Table
            columns={columns}
            dataSource={demoUsers}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card
          title={
            <div className="flex items-center">
              <RotateCcw size={20} className="mr-2 text-orange-600" />
              数据管理
            </div>
          }
          className="border-0 shadow-sm"
        >
          <Alert
            message="重置数据将恢复到初始演示状态，所有操作记录将被清除"
            type="warning"
            showIcon
            className="mb-4"
          />
          <Descriptions column={1} size="small" className="mb-4">
            <Descriptions.Item label="当前登录">{user?.name}（{user && roleNames[user.role]}）</Descriptions.Item>
          </Descriptions>
          <Button
            danger
            icon={<RotateCcw size={16} />}
            onClick={() => setResetModalVisible(true)}
          >
            重置所有数据
          </Button>
        </Card>

        <Card
          title={
            <div className="flex items-center">
              <Info size={20} className="mr-2 text-green-600" />
              操作说明
            </div>
          }
          className="border-0 shadow-sm lg:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">店长操作</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 处理促销陈列任务</li>
                <li>• 接收并回复巡店整改</li>
                <li>• 查看退回原因，重新整改</li>
                <li>• 添加沟通备注</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">督导操作</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• 发起巡店整改</li>
                <li>• 关联促销陈列任务</li>
                <li>• 审核整改结果</li>
                <li>• 退回不合格项（触发提醒）</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">商品专员操作</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 创建促销陈列任务</li>
                <li>• 跟踪陈列执行情况</li>
                <li>• 查看关联的巡店整改</li>
                <li>• 确认陈列效果</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        title="确认重置数据"
        open={resetModalVisible}
        onOk={handleReset}
        onCancel={() => setResetModalVisible(false)}
        okText="确认重置"
        okButtonProps={{ danger: true }}
        confirmLoading={resetting}
      >
        <p className="text-gray-600">确定要重置所有数据吗？此操作不可恢复，将恢复到初始演示状态。</p>
      </Modal>
    </div>
  );
}
