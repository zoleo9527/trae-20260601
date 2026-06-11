import { useEffect } from 'react';
import { Spin, App as AntdApp } from 'antd';
import { useAppStore } from './store/appStore';
import AppLayout from './components/Layout';

export default function App() {
  const { init, loading, error, currentUser } = useAppStore();
  const { message } = AntdApp.useApp();

  useEffect(() => {
    init();
    const interval = setInterval(() => {
      useAppStore.getState().scanForGaps();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error, message]);

  if (loading && !currentUser) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="系统初始化中..." />
      </div>
    );
  }

  return <AppLayout />;
}
