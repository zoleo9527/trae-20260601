import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import BillList from './pages/BillList';
import BillDetail from './pages/BillDetail';
import ComplaintList from './pages/ComplaintList';
import ComplaintDetail from './pages/ComplaintDetail';

function App() {
  const [constants, setConstants] = useState(null);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setConstants(data));
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🥛 乳品配送站 - 月结账单与客户申诉系统</h1>
        <nav className="nav">
          <NavLink to="/bills" className={({ isActive }) => isActive ? 'active' : ''}>
            📋 月结账单
          </NavLink>
          <NavLink to="/complaints" className={({ isActive }) => isActive ? 'active' : ''}>
            📝 客户申诉
          </NavLink>
        </nav>
      </header>
      
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/bills" replace />} />
          <Route path="/bills" element={<BillList constants={constants} />} />
          <Route path="/bills/:id" element={<BillDetail constants={constants} />} />
          <Route path="/complaints" element={<ComplaintList constants={constants} />} />
          <Route path="/complaints/:id" element={<ComplaintDetail constants={constants} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
