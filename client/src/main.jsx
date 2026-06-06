import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { TicketProvider } from './context/TicketContext'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('应用错误:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f7fa',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h2 style={{ color: '#ff4d4f', marginBottom: '16px' }}>页面加载出错</h2>
            <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
              抱歉，应用遇到了一些问题。您可以尝试刷新页面。
            </p>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 32px',
                background: '#1677ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('找不到 root 元素')
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <TicketProvider>
              <App />
            </TicketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
}
