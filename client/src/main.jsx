import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

const validRoutes = ['/', '/plans', '/hazards', '/notices', '/appointments', '/revisits', '/visits', '/customers'];
const pathname = window.location.pathname;
const hash = window.location.hash;

if (!hash && pathname !== '/' && validRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
  window.location.replace(`/#${pathname}${window.location.search}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6
        }
      }}
    >
      <AntdApp>
        <HashRouter>
          <App />
        </HashRouter>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
);
