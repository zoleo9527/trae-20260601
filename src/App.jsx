import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import BikesList from './pages/BikesList.jsx'
import BikeDetail from './pages/BikeDetail.jsx'
import InspectionTasks from './pages/InspectionTasks.jsx'
import TaskDetail from './pages/TaskDetail.jsx'
import FaultList from './pages/FaultList.jsx'
import FaultDetail from './pages/FaultDetail.jsx'
import RepairList from './pages/RepairList.jsx'
import RepairDetail from './pages/RepairDetail.jsx'
import Statistics from './pages/Statistics.jsx'

function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🚲 共享单车运维</h2>
          <p>车辆巡检与故障上报</p>
        </div>
        <ul className="sidebar-nav">
          <li>
            <NavLink to="/bikes" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">🚲</span>
              <span>车辆列表</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/inspection-tasks" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">📋</span>
              <span>巡检任务</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/faults" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">⚠️</span>
              <span>故障上报</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/repairs" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">🔧</span>
              <span>维修去向</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/statistics" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">📊</span>
              <span>区域统计</span>
            </NavLink>
          </li>
        </ul>
      </aside>
      <div className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>共享单车运维管理系统</h1>
          </div>
          <div className="header-user">
            <span>👤 管理员</span>
          </div>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<BikesList />} />
            <Route path="/bikes" element={<BikesList />} />
            <Route path="/bikes/:id" element={<BikeDetail />} />
            <Route path="/inspection-tasks" element={<InspectionTasks />} />
            <Route path="/inspection-tasks/:id" element={<TaskDetail />} />
            <Route path="/faults" element={<FaultList />} />
            <Route path="/faults/:id" element={<FaultDetail />} />
            <Route path="/repairs" element={<RepairList />} />
            <Route path="/repairs/:id" element={<RepairDetail />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
