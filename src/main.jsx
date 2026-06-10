import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#e63946',
          borderRadius: 4,
          colorBgContainer: '#16213e',
          colorBgElevated: '#1a1a2e',
          colorBgLayout: '#0f0f1e',
          colorText: '#e0e0e0',
          colorTextSecondary: '#8c8c8c',
          colorBorder: 'rgba(255,255,255,0.06)',
          colorBorderSecondary: 'rgba(255,255,255,0.04)',
        },
        components: {
          Menu: {
            itemBg: '#1a1a2e',
            itemColor: '#b0b0b0',
            itemSelectedBg: '#e63946',
            itemSelectedColor: '#fff',
            itemHoverBg: '#2a2a4e',
            itemHoverColor: '#e0e0e0',
          },
          Table: {
            colorBgContainer: 'transparent',
            headerBg: 'rgba(22,33,62,0.6)',
            headerColor: '#8c8c8c',
            rowHoverBg: 'rgba(255,255,255,0.03)',
          },
          Card: {
            colorBgContainer: '#16213e',
            colorBorderSecondary: 'rgba(255,255,255,0.06)',
          },
          Modal: {
            contentBg: '#16213e',
            headerBg: '#16213e',
          },
          Drawer: {
            colorBgElevated: '#1a1a2e',
          },
          Select: {
            colorBgContainer: 'rgba(22,33,62,0.6)',
            optionSelectedBg: 'rgba(230,57,70,0.15)',
          },
          Input: {
            colorBgContainer: 'rgba(22,33,62,0.6)',
          },
          Button: {
            defaultBg: 'rgba(22,33,62,0.6)',
            defaultBorderColor: 'rgba(255,255,255,0.1)',
          },
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
