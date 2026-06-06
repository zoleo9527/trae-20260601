import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const TestApp = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>测试页面</h1>
      <p>如果能看到这行字，说明 React 挂载成功</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <TestApp />
)
