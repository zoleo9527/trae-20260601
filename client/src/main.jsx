import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { TicketProvider } from './context/TicketContext.jsx'
import './index.css'

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
            padding: '32px', 
            borderRadius: '8px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#ff4d4f', marginBottom: '16px' }}>应用出错了</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              {this.state.error?.message || '发生了未知错误'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 24px',
                background: '#1677ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <TicketProvider>
          <App />
        </TicketProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>,
)
